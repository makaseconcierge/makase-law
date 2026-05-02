import type { OfficesOfficeId } from './Offices.js';
import type { TeamsTeamId } from './Teams.js';
import type { TasksTaskId } from './Tasks.js';
import type { InvoicesInvoiceId } from './Invoices.js';
import type { UserProfilesUserId } from './UserProfiles.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.time_entries */
export type TimeEntriesTimeEntryId = string;

/** Represents the table app.time_entries */
export default interface TimeEntriesTable {
  time_entry_id: ColumnType<TimeEntriesTimeEntryId, TimeEntriesTimeEntryId | undefined, TimeEntriesTimeEntryId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  team_id: ColumnType<TeamsTeamId, TeamsTeamId, TeamsTeamId>;

  task_id: ColumnType<TasksTaskId, TasksTaskId, TasksTaskId>;

  invoice_id: ColumnType<InvoicesInvoiceId | null, InvoicesInvoiceId | null, InvoicesInvoiceId | null>;

  user_id: ColumnType<UserProfilesUserId, UserProfilesUserId, UserProfilesUserId>;

  start_timestamp: ColumnType<Date, Date | string, Date | string>;

  end_timestamp: ColumnType<Date, Date | string, Date | string>;

  duration_seconds: ColumnType<number, never, never>;

  description: ColumnType<string | null, string | null, string | null>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;
}

export type TimeEntries = Selectable<TimeEntriesTable>;

export type NewTimeEntries = Insertable<TimeEntriesTable>;

export type TimeEntriesUpdate = Updateable<TimeEntriesTable>;