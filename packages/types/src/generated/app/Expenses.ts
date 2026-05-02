import type { OfficesOfficeId } from './Offices.js';
import type { TeamsTeamId } from './Teams.js';
import type { MattersMatterId } from './Matters.js';
import type { UserProfilesUserId } from './UserProfiles.js';
import type { InvoicesInvoiceId } from './Invoices.js';
import type { JsonValue } from '../../json-types.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app._expenses */
export type ExpensesExpenseId = string;

/** Represents the table app._expenses */
export default interface ExpensesTable {
  expense_id: ColumnType<ExpensesExpenseId, ExpensesExpenseId | undefined, ExpensesExpenseId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  team_id: ColumnType<TeamsTeamId, TeamsTeamId, TeamsTeamId>;

  matter_id: ColumnType<MattersMatterId | null, MattersMatterId | null, MattersMatterId | null>;

  user_id: ColumnType<UserProfilesUserId, UserProfilesUserId, UserProfilesUserId>;

  invoice_id: ColumnType<InvoicesInvoiceId | null, InvoicesInvoiceId | null, InvoicesInvoiceId | null>;

  amount: ColumnType<string, string, string>;

  description: ColumnType<string | null, string | null, string | null>;

  is_reimbursable: ColumnType<boolean, boolean | undefined, boolean>;

  billable: ColumnType<boolean, boolean | undefined, boolean>;

  charge_client: ColumnType<boolean, boolean | undefined, boolean>;

  receipt_path: ColumnType<string[], string[] | undefined, string[]>;

  external_invoice_data: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  matter_is_deleted: ColumnType<boolean, boolean | undefined, boolean>;

  matter_is_archived: ColumnType<boolean, boolean | undefined, boolean>;
}

export type Expenses = Selectable<ExpensesTable>;

export type NewExpenses = Insertable<ExpensesTable>;

export type ExpensesUpdate = Updateable<ExpensesTable>;