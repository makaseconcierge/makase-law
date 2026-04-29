import { sql } from "kysely";
import { _rootDb } from "../db/dbClient";
import { authenticatedContext, getUserContext, hasUserContext } from "./loggedInContext";
import type { Employee } from "@makase-law/types";

/**
 * Well-known user_id for unattended processes (cron, migrations, admin
 * scripts). Seeded in the core_tables migration. Use `runAsSystem(fn)`
 * rather than referencing this UUID directly at callsites.
 */
export const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Executes `fn` inside a single database transaction attributed to
 * `actingUserId`. The attribution is set on the pinned connection via
 * `set_config('app.acting_user_id', ..., true)`, which the BEFORE
 * INSERT/UPDATE triggers on auditable tables read to populate
 * `created_by`/`updated_by` and, for soft-deletable tables, `deleted_by`.
 *
 * Semantics:
 *  - All Kysely queries inside `fn` that go through `getDb()` run on the
 *    same connection inside the same transaction. Reads see uncommitted
 *    writes from earlier in the same scope.
 *  - A thrown error rolls back the transaction; the attribution GUC is
 *    automatically cleared because it was set with `is_local = true`.
 *  - Nested `runAsEmployee` calls always throw — a request must have exactly one
 *    attributed scope. If you hit this, a service is being called from
 *    inside middleware that already opened a `runAsEmployee` scope, which is a
 *    bug.
 */
export async function runAsEmployee<T>(
  employee: Employee,
  fn: () => Promise<T>,
): Promise<T> {
  const userContext = getUserContext();

  await sql`
    SELECT set_config('app.acting_office_id', ${employee.office_id}, true);
  `.execute(userContext.db);

  const employeeContext = {
    ...userContext,
    loggedInOfficeId: employee.office_id,
    permittedTeamIds: [],
  };
  return authenticatedContext.run(employeeContext, fn);
}

export async function runAsUser<T>(user_id: string, fn: () => Promise<T>): Promise<T> {
  if (hasUserContext()) {
    throw new Error(
      "runAsUser called inside an existing runAsUser scope. Only one attributed transaction scope is allowed per request.",
    );
  }
  
  return _rootDb.transaction().execute(async (trx) => {
    const userContext = { db: trx, loggedInUserId: user_id };
    await sql`
      SELECT set_config('app.acting_user_id', ${user_id}, true);
    `.execute(userContext.db);
    return authenticatedContext.run(userContext, fn);
  });
}