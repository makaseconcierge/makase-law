import type { OfficesOfficeId } from './Offices.js';
import type { MattersMatterId } from './Matters.js';
import type { LeadsLeadId } from './Leads.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app._tasks */
export type TasksTaskId = string;

/** Represents the table app._tasks */
export default interface TasksTable {
  task_id: ColumnType<TasksTaskId, TasksTaskId | undefined, TasksTaskId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  matter_id: ColumnType<MattersMatterId | null, MattersMatterId | null, MattersMatterId | null>;

  lead_id: ColumnType<LeadsLeadId | null, LeadsLeadId | null, LeadsLeadId | null>;

  assigned_to: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;

  name: ColumnType<string, string, string>;

  description: ColumnType<string, string | undefined, string>;

  status: ColumnType<string, string | undefined, string>;

  due_date: ColumnType<Date | null, Date | string | null, Date | string | null>;

  billable: ColumnType<boolean, boolean | undefined, boolean>;

  no_charge: ColumnType<boolean, boolean | undefined, boolean>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  deleted_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  deleted_by: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;
}

export type Tasks = Selectable<TasksTable>;

export type NewTasks = Insertable<TasksTable>;

export type TasksUpdate = Updateable<TasksTable>;