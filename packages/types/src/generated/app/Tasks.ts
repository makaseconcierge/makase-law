import type { OfficesOfficeId } from './Offices.js';
import type { TeamsTeamId } from './Teams.js';
import type { MattersMatterId } from './Matters.js';
import type { LeadsLeadId } from './Leads.js';
import type { UserProfilesUserId } from './UserProfiles.js';
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

  assigned_to: ColumnType<UserProfilesUserId | null, UserProfilesUserId | null, UserProfilesUserId | null>;

  name: ColumnType<string, string, string>;

  description: ColumnType<string, string | undefined, string>;

  status: ColumnType<string, string | undefined, string>;

  ready_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  completed_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  due_date: ColumnType<Date | null, Date | string | null, Date | string | null>;

  billable: ColumnType<boolean, boolean, boolean>;

  charge_client: ColumnType<boolean, boolean, boolean>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;
}

export type Tasks = Selectable<TasksTable>;

export type NewTasks = Insertable<TasksTable>;

export type TasksUpdate = Updateable<TasksTable>;