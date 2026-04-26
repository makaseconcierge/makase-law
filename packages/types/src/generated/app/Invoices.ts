import type { OfficesOfficeId } from './Offices.js';
import type { TeamsTeamId } from './Teams.js';
import type { MattersMatterId } from './Matters.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.invoices */
export type InvoicesInvoiceId = string;

/** Represents the table app.invoices */
export default interface InvoicesTable {
  invoice_id: ColumnType<InvoicesInvoiceId, InvoicesInvoiceId | undefined, InvoicesInvoiceId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  team_id: ColumnType<TeamsTeamId, TeamsTeamId, TeamsTeamId>;

  matter_id: ColumnType<MattersMatterId | null, MattersMatterId | null, MattersMatterId | null>;

  status: ColumnType<string, string | undefined, string>;

  notes: ColumnType<string | null, string | null, string | null>;

  due_date: ColumnType<Date | null, Date | string | null, Date | string | null>;

  sent_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  billed_amount: ColumnType<string, string, string>;

  late_fee_rate: ColumnType<string, string, string>;

  late_fee_amount: ColumnType<string, string | undefined, string>;

  total_amount: ColumnType<string, string | undefined, string>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type Invoices = Selectable<InvoicesTable>;

export type NewInvoices = Insertable<InvoicesTable>;

export type InvoicesUpdate = Updateable<InvoicesTable>;