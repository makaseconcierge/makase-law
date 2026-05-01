import type { NewTask } from "@makase-law/types";
import { getLogger } from "@logtape/logtape";
import { sql } from "kysely";
import { getEmployeeContext } from "../../context/logged-in-context";
import { getScope, buildScopeFilter } from "../../context/scope";

const logger = getLogger(["taskService"]);

const TASKS_RESOURCE = "tasks";

const permitTask = (action: string) =>
  buildScopeFilter(TASKS_RESOURCE, action, ["assigned_to"]);

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
  const { db, loggedInUserId, loggedInOfficeId, teamIds } = getEmployeeContext();
  const scope = getScope(TASKS_RESOURCE, "create");
  if (scope !== "office" && !teamIds.includes(data.team_id)) throw new Error("Unauthorized");
  if (scope === "self" && data.assigned_to !== loggedInUserId) throw new Error("Unauthorized");
  logger.info("Creating new task", data);
  return db.insertInto("tasks")
    .values({ ...data, office_id: loggedInOfficeId })
    .returningAll()
    .executeTakeFirst();
}

export async function assign(task_id: string, assigned_to: string | null) {
  const { db } = getEmployeeContext();
  logger.info("Assigning task", { task_id, assigned_to });
  return db.updateTable("tasks")
    .where(permitTask("assign"))
    .where("task_id", "=", task_id)
    .set({ assigned_to })
    .returningAll()
    .executeTakeFirst();
}

export async function updateName(task_id: string, name: string) {
  const { db } = getEmployeeContext();
  logger.info("Updating task name", { task_id, name });
  return db.updateTable("tasks")
    .where(permitTask("updateName"))
    .where("task_id", "=", task_id)
    .set({ name })
    .returningAll()
    .executeTakeFirst();
}

export async function updateDescription(task_id: string, description: string) {
  const { db } = getEmployeeContext();
  logger.info("Updating task description", { task_id });
  return db.updateTable("tasks")
    .where(permitTask("updateDescription"))
    .where("task_id", "=", task_id)
    .set({ description })
    .returningAll()
    .executeTakeFirst();
}

export async function updateReadyAt(task_id: string, ready_at: Date | string | null) {
  const { db } = getEmployeeContext();
  logger.info("Updating task ready_at", { task_id, ready_at });
  return db.updateTable("tasks")
    .where(permitTask("updateReadyAt"))
    .where("task_id", "=", task_id)
    .set({ ready_at })
    .returningAll()
    .executeTakeFirst();
}

export async function updateCompletedAt(task_id: string, completed_at: Date | string | null) {
  const { db } = getEmployeeContext();
  logger.info("Updating task completed_at", { task_id, completed_at });
  return db.updateTable("tasks")
    .where(permitTask("updateCompletedAt"))
    .where("task_id", "=", task_id)
    .set({ completed_at })
    .returningAll()
    .executeTakeFirst();
}

export async function updateDueDate(task_id: string, due_date: Date | string | null) {
  const { db } = getEmployeeContext();
  logger.info("Updating task due_date", { task_id, due_date });
  return db.updateTable("tasks")
    .where(permitTask("updateDueDate"))
    .where("task_id", "=", task_id)
    .set({ due_date })
    .returningAll()
    .executeTakeFirst();
}

export async function updateBillable(task_id: string, billable: boolean) {
  const { db } = getEmployeeContext();
  logger.info("Updating task billable", { task_id, billable });
  return db.updateTable("tasks")
    .where(permitTask("updateBillable"))
    .where("task_id", "=", task_id)
    .set({ billable })
    .returningAll()
    .executeTakeFirst();
}

export async function updateChargeClient(task_id: string, charge_client: boolean) {
  const { db } = getEmployeeContext();
  logger.info("Updating task charge_client", { task_id, charge_client });
  return db.updateTable("tasks")
    .where(permitTask("updateChargeClient"))
    .where("task_id", "=", task_id)
    .set({ charge_client })
    .returningAll()
    .executeTakeFirst();
}
