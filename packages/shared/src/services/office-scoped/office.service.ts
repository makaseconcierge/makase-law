import type { OfficePatch } from "@makase-law/types";
import { getLogger } from "@logtape/logtape";
import { getEmployeeContext } from "../../context/loggedInContext";

const logger = getLogger(["officeService"]);

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
  const { db, loggedInOfficeId, isAdmin } = getEmployeeContext();
  if (!isAdmin) {
    throw new Error("You are not authorized to update the office");
  }
  logger.info("Updating office", { officePatch });
  return db
    .updateTable("offices")
    .where("office_id", "=", loggedInOfficeId)
    .set(officePatch)
    .returningAll()
    .executeTakeFirst();
}
