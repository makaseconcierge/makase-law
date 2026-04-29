import { sql } from "kysely";
import { rootDb } from "../db/dbClient";
import { authenticatedContext, alreadyHasContext } from "./loggedInContext";
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
  if (alreadyHasContext()) {
    throw new Error(
      "runAsEmployee called inside an existing runAsEmployee scope. Only one attributed transaction scope is allowed per request.",
    );
  }

  return rootDb.transaction().execute(async (trx) => {
    await sql`
      SELECT set_config('app.acting_user_id', ${employee.user_id}, true);
      SELECT set_config('app.acting_office_id', ${employee.office_id}, true);
    `.execute(trx);
    return authenticatedContext.run({ db: trx, loggedInOfficeId: employee.office_id, loggedInUserId: employee.user_id, permittedTeamIds: [] }, fn);
  });
}

export async function runAsUser<T>(user_id: string, fn: () => Promise<T>): Promise<T> {
  if (alreadyHasContext()) {
    throw new Error(
      "runAsUser called inside an existing runAsUser scope. Only one attributed transaction scope is allowed per request.",
    );
  }
  
  return rootDb.transaction().execute(async (trx) => {
    await sql`
      SELECT set_config('app.acting_user_id', ${user_id}, true);
    `.execute(trx);
    return authenticatedContext.run({ db: trx, loggedInUserId: user_id }, fn);
  });
}