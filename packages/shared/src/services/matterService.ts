import type { DB, MatterPatch, NewMatter } from "@makase-law/types";
import { getDb } from "../db/dbClient";
import { getLogger } from "@logtape/logtape";
import type { ExpressionBuilder } from "kysely";

let logger = getLogger(["matterService"]);

type PermissionParams = {
  office_id: string;
  user_id: string;
  allowedTeamIds: string[];
}

function getPermissionedWhere({office_id, user_id, allowedTeamIds}: PermissionParams) {
  return (eb: ExpressionBuilder<DB, "matters">) =>
    eb.and([
      eb("office_id", "=", office_id),
      eb.or([
        ...(allowedTeamIds?.length ? [eb("team_id", "in", allowedTeamIds)] : []),
        eb("responsible_attorney_id", "=", user_id),
      ])
    ])
}

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

export async function get({office_id, user_id, allowedTeamIds}: PermissionParams, matter_id: string) {
  logger.trace("Getting matter", { office_id, allowedTeamIds, matter_id });
  return getDb()
    .selectFrom("matters")
    .selectAll()
    .where(getPermissionedWhere({office_id, user_id, allowedTeamIds}))
    .where("matter_id", "=", matter_id)
    .executeTakeFirst();
}

export async function update(
  {office_id, user_id, allowedTeamIds}: PermissionParams,
  matter_id: string,
  data: MatterPatch,
) {
  logger.info("Updating matter", { office_id, user_id, allowedTeamIds, matter_id, data });
  return getDb()
    .updateTable("matters")
    .where("office_id", "=", office_id)
    .where((eb) =>
      eb.or([
        ...(allowedTeamIds?.length ? [eb("team_id", "in", allowedTeamIds)] : []),
        eb("responsible_attorney_id", "=", user_id),
      ]),
    )
    .where("matter_id", "=", matter_id)
    .set(data)
    .returningAll()
    .executeTakeFirst();
}

export async function list({office_id, user_id, allowedTeamIds}: PermissionParams) {
  logger.trace("Listing matters", { office_id, user_id, allowedTeamIds });
  return getDb()
    .selectFrom("matters")
    .selectAll()
    .where(getPermissionedWhere({office_id, user_id, allowedTeamIds}))
    .execute();
}
