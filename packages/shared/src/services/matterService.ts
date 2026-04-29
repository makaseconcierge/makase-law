import type { DB, MatterPatch, NewMatter } from "@makase-law/types";
import { getLogger } from "@logtape/logtape";
import type { ExpressionBuilder, Kysely, Transaction } from "kysely";
import { getEmployeeContext, getUserContext } from "../context/loggedInContext";

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
  const { loggedInOfficeId, db } = getEmployeeContext();
  logger.info("Creating new matter", data);
  return db.insertInto("matters")
    .values({ ...data, office_id: loggedInOfficeId })
    .returningAll()
    .executeTakeFirst();
}

export async function get(matter_id: string) {
  const { db } = getEmployeeContext();
  logger.trace("Getting matter", { matter_id });
  return db.selectFrom("matters")
    .selectAll()
    .where(employeeIsPermitted())
    .where("matter_id", "=", matter_id)
    .executeTakeFirst();
}

export async function update(
  matter_id: string,
  data: MatterPatch,
) {
  const { db } = getEmployeeContext();
  logger.info("Updating matter", { matter_id, data });
  return db.updateTable("matters")
    .where(employeeIsPermitted())
    .where("matter_id", "=", matter_id)
    .set(data)
    .returningAll()
    .executeTakeFirst();
}

export async function list() {
  const { db } = getEmployeeContext();
  logger.trace("Listing matters");
  return db.selectFrom("matters")
    .selectAll()
    .where(employeeIsPermitted())
    .execute();
}
