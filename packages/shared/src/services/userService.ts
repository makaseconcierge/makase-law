import { getUserContext } from "../context/loggedInContext";
import { getLogger } from "@logtape/logtape";

let logger = getLogger(["userService"]);

/**
 * Offices the user is currently an active employee of, plus the display
 * fields the office switcher needs. Permissions are resolved per-office
 * at request time (see `employeeService.getRoleConfig`), so this is a
 * deliberately thin payload.
 */
export async function listOffices() {
  const { loggedInUserId, db } = getUserContext();
  logger.trace("Listing offices", { loggedInUserId });
  return db
    .selectFrom("employees")
    .where("employees.user_id", "=", loggedInUserId)
    .innerJoin("offices", "employees.office_id", "offices.office_id")
    .select([
      "employees.office_id",
      "employees.is_admin",
      "offices.name",
      "offices.logo",
    ])
    .execute();
}

export async function getProfile() {
  const { loggedInUserId, db } = getUserContext();
  logger.trace("Getting profile", { loggedInUserId });
  return db
    .selectFrom("user_profiles")
    .selectAll()
    .where("user_id", "=", loggedInUserId)
    .executeTakeFirst();
}
