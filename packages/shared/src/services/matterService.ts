import type { DB, MatterPatch, NewMatter } from "@makase-law/types";
import { getDb } from "../db/dbClient";
import { getLogger } from "@logtape/logtape";
import type { ExpressionBuilder } from "kysely";
import { getEmployeeContext } from "../context/loggedInContext";

const logger = getLogger(["matterService"]);

function employeeIsPermitted() {
  const { loggedInOfficeId, loggedInUserId, permittedTeamIds } = getEmployeeContext();
  return (eb: ExpressionBuilder<DB, "matters">) =>
    eb.and([
      eb("office_id", "=", loggedInOfficeId),
      eb.or([
        ...(permittedTeamIds?.length ? [eb("team_id", "in", permittedTeamIds)] : []),
        eb("responsible_attorney_id", "=", loggedInUserId),
      ])
    ])
}

export async function create(
  data: NewMatter,
) {
  const { loggedInOfficeId } = getEmployeeContext();
  logger.info("Creating new matter", { loggedInOfficeId, data });
  return getDb()
    .insertInto("matters")
    .values({ ...data, office_id: loggedInOfficeId })
    .returningAll()
    .executeTakeFirst();
}

export async function get(matter_id: string) {
  logger.trace("Getting matter", { matter_id });
  return getDb()
    .selectFrom("matters")
    .selectAll()
    .where(employeeIsPermitted())
    .where("matter_id", "=", matter_id)
    .executeTakeFirst();
}

export async function update(
  matter_id: string,
  data: MatterPatch,
) {
  logger.info("Updating matter", { matter_id, data });
  return getDb()
    .updateTable("matters")
    .where(employeeIsPermitted())
    .where("matter_id", "=", matter_id)
    .set(data)
    .returningAll()
    .executeTakeFirst();
}

export async function list() {
  logger.trace("Listing matters");
  return getDb()
    .selectFrom("matters")
    .selectAll()
    .where(employeeIsPermitted())
    .execute();
}
