import type { OfficePatch } from "@makase-law/types";
import { getDb } from "../db/dbClient";
import { getLogger } from "@logtape/logtape";

let logger = getLogger(["officeService"]);

export async function get(office_id: string) {
  logger.trace("Getting office", { office_id });
  return getDb()
    .selectFrom("offices")
    .selectAll()
    .where("office_id", "=", office_id)
    .executeTakeFirst();
}

export async function update(office_id: string, data: OfficePatch) {
  logger.info("Updating office", { office_id, data });
  return getDb()
    .updateTable("offices")
    .where("office_id", "=", office_id)
    .set(data)
    .returningAll()
    .executeTakeFirst();
}
