import type { OfficePatch } from "@makase-law/types";
import { getLogger } from "@logtape/logtape";
import { getEmployeeContext } from "../../context/logged-in-context";
import { getScope } from "../../context/scope";

const logger = getLogger(["office-service"]);

const OFFICE_RESOURCE = "office";

export function hasOfficePermission(permission: string) {
  const { isAdmin, permissions } = getEmployeeContext();
  if (isAdmin) return true;
  return permissions?.office?.[permission];
}

export async function get() {
  const { db, loggedInOfficeId } = getEmployeeContext();
  logger.trace("Getting office");
  return db
    .selectFrom("offices")
    .selectAll()
    .where("office_id", "=", loggedInOfficeId)
    .executeTakeFirst();
}

export async function update(officePatch: OfficePatch) {
  const { db, loggedInOfficeId } = getEmployeeContext();
  if (getScope(OFFICE_RESOURCE, "update") !== "office") throw { status: 403, message: "Invalid scope for office update" };
  logger.info("Updating office", { officePatch });
  return db
    .updateTable("offices")
    .where("office_id", "=", loggedInOfficeId)
    .set(officePatch)
    .returningAll()
    .executeTakeFirst();
}
