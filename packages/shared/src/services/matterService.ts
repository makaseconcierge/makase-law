import type { MatterPatch, NewMatter } from "@makase-law/types";
import { getDb } from "../db/dbClient";
import { getLogger } from "@logtape/logtape";

let logger = getLogger(["matterService"]);

export async function create(
  office_id: string,
  data: NewMatter,
) {
  logger.info("Creating new matter", { office_id, data });
  return getDb()
    .insertInto("matters")
    .values({ ...data, office_id })
    .returningAll()
    .executeTakeFirst();
}

export async function get(office_id: string, matter_id: string) {
  logger.trace("Getting matter", { office_id, matter_id });
  return getDb()
    .selectFrom("matters")
    .selectAll()
    .where("office_id", "=", office_id)
    .where("matter_id", "=", matter_id)
    .executeTakeFirst();
}

export async function update(
  office_id: string,
  matter_id: string,
  data: MatterPatch,
) {
  logger.info("Updating matter", { office_id, matter_id, data });
  return getDb()
    .updateTable("matters")
    .where("office_id", "=", office_id)
    .where("matter_id", "=", matter_id)
    .set(data)
    .returningAll()
    .executeTakeFirst();
}

export async function list(office_id: string) {
  logger.trace("Listing matters", { office_id });
  return getDb()
    .selectFrom("matters")
    .selectAll()
    .where("office_id", "=", office_id)
    .execute();
}
