
import { getUserContext } from "../../context/logged-in-context";
import { getLogger } from "@logtape/logtape";
import { mergeRolePermissions } from "@makase-law/utils";

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
      "offices.slug"
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


export async function getTeamIdsAtOffice(office_id: string) {
  const { db, loggedInUserId } = getUserContext();
  logger.trace("Getting teams for office", { office_id });
  return db.selectFrom("employee_teams")
    .select(["team_id"])
    .where("office_id", "=", office_id)
    .where("user_id", "=", loggedInUserId)
    .execute()
    .then((rows) => rows.map((row) => row.team_id));
}

export async function getRolesAtOffice(office_id: string) {
  const { db, loggedInUserId } = getUserContext();
  logger.trace("Getting roles for office", { office_id });
  return db.selectFrom("employee_roles as er")
    .innerJoin("roles as r", (join) =>
      join
        .onRef("r.role_id", "=", "er.role_id")
        .onRef("r.office_id", "=", "er.office_id"),
    )
    .select(["r.role_id", "r.name", "r.permissions"])
    .where("er.office_id", "=", office_id)
    .where("er.user_id", "=", loggedInUserId)
    .execute();
}

export async function getCustomMatterAccessAtOffice(office_id: string) {
  const { db, loggedInUserId } = getUserContext();
  logger.trace("Getting custom matter access for office", { office_id });
  return db.selectFrom("custom_matter_access")
    .select(["matter_id", "access_modifier"])
    .where("office_id", "=", office_id)
    .where("user_id", "=", loggedInUserId)
    .where("matter_is_archived", "is", false)
    .execute();
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
  const roles = await getRolesAtOffice(office_id);
  return mergeRolePermissions(roles);
}
