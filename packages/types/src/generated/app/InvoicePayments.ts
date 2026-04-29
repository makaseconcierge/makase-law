import type { OfficesOfficeId } from './Offices.js';
import type { TeamsTeamId } from './Teams.js';
import type { MattersMatterId } from './Matters.js';
import type { InvoicesInvoiceId } from './Invoices.js';
import type { JsonValue } from '../../jsonTypes.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.invoice_payments */
export type InvoicePaymentsInvoicePaymentId = string;

/** Represents the table app.invoice_payments */
export default interface InvoicePaymentsTable {
  invoice_payment_id: ColumnType<InvoicePaymentsInvoicePaymentId, InvoicePaymentsInvoicePaymentId | undefined, InvoicePaymentsInvoicePaymentId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  team_id: ColumnType<TeamsTeamId, TeamsTeamId, TeamsTeamId>;

  matter_id: ColumnType<MattersMatterId, MattersMatterId, MattersMatterId>;

  invoice_id: ColumnType<InvoicesInvoiceId | null, InvoicesInvoiceId | null, InvoicesInvoiceId | null>;

  amount: ColumnType<string, string, string>;

  payment_date: ColumnType<Date, Date | string, Date | string>;

  notes: ColumnType<string | null, string | null, string | null>;

  external_id: ColumnType<string | null, string | null, string | null>;

  external_type: ColumnType<string | null, string | null, string | null>;

  external_url: ColumnType<string | null, string | null, string | null>;

  external_data: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type InvoicePayments = Selectable<InvoicePaymentsTable>;

export type NewInvoicePayments = Insertable<InvoicePaymentsTable>;

export type InvoicePaymentsUpdate = Updateable<InvoicePaymentsTable>;