import { rootDb } from "../db/dbClient";
import { getLogger } from "@logtape/logtape";

let logger = getLogger(["userService"]);

/**
 * Offices the user is currently an active employee of, plus the display
 * fields the office switcher needs. Permissions are resolved per-office
 * at request time (see `employeeService.getRoleConfig`), so this is a
 * deliberately thin payload.
 */
export async function listOffices(user_id: string) {
  logger.trace("Listing offices", { user_id });
  return rootDb
    .selectFrom("employees")
    .where("employees.user_id", "=", user_id)
    .innerJoin("offices", "employees.office_id", "offices.office_id")
    .select([
      "employees.office_id",
      "employees.is_admin",
      "offices.name",
      "offices.logo",
    ])
    .execute();
}

export async function getProfile(user_id: string) {
  logger.trace("Getting profile", { user_id });
  return rootDb
    .selectFrom("user_profiles")
    .selectAll()
    .where("user_id", "=", user_id)
    .executeTakeFirst();
}

console.log(rootDb
  .selectFrom("employees")
  .where("employees.user_id", "=", 'user_idasddfasdfadsf')
  .innerJoin("offices", "employees.office_id", "offices.office_id")
  .select([
    "employees.office_id",
    "employees.is_admin",
    "offices.name",
    "offices.logo",
  ]).compile().sql);