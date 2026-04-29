import type { MatterPatch, NewMatter } from "@makase-law/types";
import { getDb } from "../db/dbClient";
import { getLogger } from "@logtape/logtape";

let logger = getLogger(["matterService"]);

export async function create(
  office_id: string,
  team_id: string,
  data: NewMatter,
) {
  logger.info("Creating new matter", { office_id, team_id, data });
  return getDb()
    .insertInto("matters")
    .values({ ...data, team_id, office_id })
    .returningAll()
    .executeTakeFirst();
}

export async function get(office_id: string, user_id: string, allowedTeamIds: string[] | undefined, matter_id: string) {
  logger.trace("Getting matter", { office_id, allowedTeamIds, matter_id });
  return getDb()
    .selectFrom("matters")
    .selectAll()
    .where("office_id", "=", office_id)
    .where((eb) =>
      eb.or([
        ...(allowedTeamIds?.length ? [eb("team_id", "in", allowedTeamIds)] : []),
        eb("responsible_attorney_id", "=", user_id),
      ]),
    )
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

export async function list(office_id: string, allowedTeamIds: string[]) {
  logger.trace("Listing matters", { office_id });
  return getDb()
    .selectFrom("matters")
    .selectAll()
    .where("office_id", "=", office_id)
    .execute();
}
