import type { NewTask, TaskPatch } from "@makase-law/types";
import { getLogger } from "@logtape/logtape";
import { sql } from "kysely";
import { getEmployeeContext } from "../../context/logged-in-context";
import { getScope, buildMatterTeamSelfScopeFilter, assertInsertScope } from "../../context/scope";

const logger = getLogger(["taskService"]);

const TASKS_RESOURCE = "tasks";

const permitTask = (action: string) =>
  buildMatterTeamSelfScopeFilter(TASKS_RESOURCE, action, ["assigned_to"]);

export async function get(task_id: string) {
  const { db } = getEmployeeContext();
  logger.trace("Getting task", { task_id });
  return db.selectFrom("tasks")
    .selectAll()
    .where(permitTask("read"))
    .where("task_id", "=", task_id)
    .executeTakeFirst();
}

export type TaskSearchFilters = {
  assigneeIds?: string[];
  teamIds?: string[];
  nameOrDescriptionLike?: string;
  isReady?: boolean;
  isCompleted?: boolean;
  isOverDue?: boolean;
};

export async function search(filters: TaskSearchFilters = {}) {
  const { db } = getEmployeeContext();
  logger.trace("Searching tasks", filters);
  let query = db.selectFrom("tasks").selectAll().where(permitTask("read"));

  if (filters.assigneeIds?.length) {
    query = query.where("assigned_to", "in", filters.assigneeIds);
  }
  if (filters.teamIds?.length) {
    query = query.where("team_id", "in", filters.teamIds);
  }
  if (filters.nameOrDescriptionLike) {
    const pattern = `%${filters.nameOrDescriptionLike}%`;
    query = query.where(eb => eb.or([
      eb("name", "ilike", pattern),
      eb("description", "ilike", pattern),
    ]));
  }
  if (filters.isReady !== undefined) {
    query = filters.isReady
      ? query.where("ready_at", "is not", null)
      : query.where("ready_at", "is", null);
  }
  if (filters.isCompleted !== undefined) {
    query = filters.isCompleted
      ? query.where("completed_at", "is not", null)
      : query.where("completed_at", "is", null);
  }
  if (filters.isOverDue !== undefined) {
    if (filters.isOverDue) {
      query = query
        .where("due_date", "<", sql<Date>`now()`)
        .where("completed_at", "is", null);
    } else {
      query = query.where(eb => eb.or([
        eb("due_date", ">=", sql<Date>`now()`),
        eb("due_date", "is", null),
        eb("completed_at", "is not", null),
      ]));
    }
  }
  return query.execute();
}

export async function create(data: NewTask) {
  const { db, loggedInOfficeId } = getEmployeeContext();
  assertInsertScope(TASKS_RESOURCE, "create", data, ["assigned_to"]);
  logger.info("Creating new task", data);
  return db.insertInto("tasks")
    .values({ ...data, office_id: loggedInOfficeId })
    .returningAll()
    .executeTakeFirst();
}


export async function patch(task_id: string, data: TaskPatch) {
  const { db } = getEmployeeContext();
  logger.info("Patching task", { task_id, ...data });
  return db.updateTable("tasks")
    .where(permitTask("update"))
    .where("task_id", "=", task_id)
    .set(data)
    .returningAll()
    .executeTakeFirst();
}
