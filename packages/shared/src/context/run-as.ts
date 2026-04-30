import { sql } from "kysely";
import { _rootDb } from "../db/_rootDb";
import { authenticatedContext, getUserContext, hasEmployeeContext, hasUserContext } from "./logged-in-context";
import type { Employee, Permissions } from "@makase-law/types";
import type { EmployeeContext } from "./logged-in-context";

/**
 * Well-known user_id for unattended processes (cron, migrations, admin
 * scripts). Seeded in the core_tables migration. Use `runAsSystem(fn)`
 * rather than referencing this UUID directly at callsites.
 */
export const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function runAsEmployee<T>(
  employee: Employee,
  permissions: Permissions,
  teamIds: string[],
  fn: () => Promise<T>,
): Promise<T> {
  const userContext = getUserContext();
  if (hasEmployeeContext()) {
    throw new Error("runAsEmployee called inside an existing runAsEmployee scope. Only one attributed transaction scope is allowed per request.");
  }

  if (userContext.loggedInUserId !== employee.user_id) {
    throw new Error("Employee context does not match user context");
  }

  await sql`
    SELECT set_config('app.acting_office_id', ${employee.office_id}, true);
  `.execute(userContext.db);

  const employeeContext: EmployeeContext = {
    ...userContext,
    loggedInOfficeId: employee.office_id,
    isAdmin: employee.is_admin,
    isSystem: false,
    permissions,
    teamIds,
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

/**
 * Unattended path for cron / migrations / bootstrap. Attributes writes to
 * SYSTEM and pins `acting_office_id` to `office_id` so RLS office-scoped
 * tables are writable. `getScope` short-circuits to `'office'`
 * for system context, so services running under this path bypass the
 * roles/permissions map entirely.
 */
export async function runAsSystem<T>(office_id: string, fn: () => Promise<T>): Promise<T> {
  if (hasUserContext()) {
    throw new Error(
      "runAsSystem called inside an existing run-as scope. Only one attributed transaction scope is allowed.",
    );
  }

  return _rootDb.transaction().execute(async (trx) => {
    await sql`SELECT set_config('app.acting_user_id', ${SYSTEM_USER_ID}, true);`.execute(trx);
    await sql`SELECT set_config('app.acting_office_id', ${office_id}, true);`.execute(trx);

    const employeeContext: EmployeeContext = {
      db: trx,
      loggedInUserId: SYSTEM_USER_ID,
      loggedInOfficeId: office_id,
      isAdmin: true,
      isSystem: true,
      permissions: {},
      teamIds: [],
    };
    return authenticatedContext.run(employeeContext, fn);
  });
}
