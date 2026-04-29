
import { getUserContext } from "../../context/loggedInContext";
import { getLogger } from "@logtape/logtape";
import { parsePermissions } from "@makase-law/utils";

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


export async function getEmploymentAtOffice(office_id: string) {
  const { db, loggedInUserId } = getUserContext();
  logger.trace("Getting employee");
  return db.selectFrom("employees")
    .selectAll()
    .where("office_id", "=", office_id)
    .where("user_id", "=", loggedInUserId)
    .executeTakeFirst();
}

export async function getPermissionsAtOffice(office_id: string) {
  const { db, loggedInUserId } = getUserContext();
  logger.trace("Getting permissions for office", { office_id });
  const rows = await db
    .selectFrom("team_member_roles as tmr")
    .innerJoin("team_roles as tr", (join) =>
      join
        .onRef("tr.team_role_id", "=", "tmr.team_role_id")
        .onRef("tr.office_id", "=", "tmr.office_id"),
    )
    .where("tmr.office_id", "=", office_id)
    .where("tmr.user_id", "=", loggedInUserId)
    .select(["tmr.team_id", "tr.role_config"])
    .execute();

  return parsePermissions(rows);
}
