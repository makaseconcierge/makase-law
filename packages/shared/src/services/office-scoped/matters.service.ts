import type { MatterPatch, NewMatter } from "@makase-law/types";
import { getLogger } from "@logtape/logtape";
import { getEmployeeContext } from "../../context/logged-in-context";
import { buildMatterTeamSelfScopeFilter, assertInsertScope } from "../../context/scope";

const logger = getLogger(["matterService"]);

const MATTERS_RESOURCE = "matters";

const permitMatter = (action: string) =>
  buildMatterTeamSelfScopeFilter(MATTERS_RESOURCE, action, ["responsible_attorney_id", "supervising_attorney_id"]);

/**
 * Deferred subquery of matter_ids the caller may access for `action` on
 * the `matters` MATTERS_RESOURCE. Child-resource services (tasks, time_entries,
 * invoices accessed via a matter context) compose this into their query:
 *   .where("matter_id", "in", permittedMatterIds("read"))
 * so they inherit matter-level scope without redeclaring "self" rules.
 */
export function permittedMatterIds(action: string) {
  const { db } = getEmployeeContext();
  return db.selectFrom("matters").select("matter_id").where(permitMatter(action));
}

export async function create(data: NewMatter) {
  const { db, loggedInOfficeId } = getEmployeeContext();
  assertInsertScope(MATTERS_RESOURCE, "create", data, ["responsible_attorney_id", "supervising_attorney_id"]);
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
    .where(permitMatter("read"))
    .where("matter_id", "=", matter_id)
    .executeTakeFirst();
}



export async function updateDetails(matter_id: string, patch: Pick<MatterPatch, "description" | "title">) {
  const { db } = getEmployeeContext();
  logger.info("Updating matter", { matter_id, patch });
  return db.updateTable("matters")
    .where(permitMatter("updateDetails"))
    .where("matter_id", "=", matter_id)
    .set(patch)
    .returningAll()
    .executeTakeFirst();
}


/**
 * Re-staff a matter. Distinct from `update` because a role may grant
 * `matters.assign` without `matters.write` (a team lead who can move
 * matters around but not edit substantive content). Scope check is
 * against the `assign` action; the row filter still uses the assign
 * scope so a self-only assigner can only re-staff their own matters.
 */
export async function assignResponsibleAttorney(matter_id: string, responsible_attorney_id: string) {
  const { db } = getEmployeeContext();
  logger.info("Assigning matter", { matter_id, responsible_attorney_id });
  return db.updateTable("matters")
    .where(permitMatter("assignResponsibleAttorney"))
    .where("matter_id", "=", matter_id)
    .set({ responsible_attorney_id })
    .returningAll()
    .executeTakeFirst();
}

export async function list() {
  const { db } = getEmployeeContext();
  logger.trace("Listing matters");
  return db.selectFrom("matters")
    .selectAll()
    .where(permitMatter("read"))
    .execute();
}
