import type { OfficesOfficeId } from './Offices.js';
import type { TeamsTeamId } from './Teams.js';
import type { MattersMatterId } from './Matters.js';
import type { LeadsLeadId } from './Leads.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.tasks */
export type TasksTaskId = string;

/** Represents the table app.tasks */
export default interface TasksTable {
  task_id: ColumnType<TasksTaskId, TasksTaskId | undefined, TasksTaskId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  team_id: ColumnType<TeamsTeamId, TeamsTeamId, TeamsTeamId>;

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
}

export type Tasks = Selectable<TasksTable>;

export type NewTasks = Insertable<TasksTable>;

export type TasksUpdate = Updateable<TasksTable>;