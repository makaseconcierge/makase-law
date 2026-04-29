import type { OfficePatch } from "@makase-law/types";
import { getLogger } from "@logtape/logtape";
import { getEmployeeContext } from "../../context/loggedInContext";

let logger = getLogger(["officeService"]);

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
  logger.info("Updating office", { officePatch });
  return db
    .updateTable("offices")
    .where("office_id", "=", loggedInOfficeId)
    .set(officePatch)
    .returningAll()
    .executeTakeFirst();
}
