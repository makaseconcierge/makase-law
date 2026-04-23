import type { OfficesOfficeId } from './Offices.js';
import type { TasksTaskId } from './Tasks.js';
import type { InvoicesInvoiceId } from './Invoices.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app._time_entries */
export type TimeEntriesTimeEntryId = string;

/** Represents the table app._time_entries */
export default interface TimeEntriesTable {
  time_entry_id: ColumnType<TimeEntriesTimeEntryId, TimeEntriesTimeEntryId | undefined, TimeEntriesTimeEntryId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  task_id: ColumnType<TasksTaskId | null, TasksTaskId | null, TasksTaskId | null>;

  invoice_id: ColumnType<InvoicesInvoiceId | null, InvoicesInvoiceId | null, InvoicesInvoiceId | null>;

  user_id: ColumnType<auth_UsersId, auth_UsersId, auth_UsersId>;

  end_timestamp: ColumnType<Date, Date | string, Date | string>;

  actual_duration: ColumnType<number, number, number>;

  billable_duration: ColumnType<number, number, number>;

  description: ColumnType<string | null, string | null, string | null>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  deleted_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  deleted_by: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;
}

export type TimeEntries = Selectable<TimeEntriesTable>;

export type NewTimeEntries = Insertable<TimeEntriesTable>;

export type TimeEntriesUpdate = Updateable<TimeEntriesTable>;