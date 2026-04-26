import type { OfficesOfficeId } from './Offices.js';
import type { MattersMatterId } from './Matters.js';
import type { InvoicesInvoiceId } from './Invoices.js';
import type { JsonValue } from '../../jsonTypes.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.expenses */
export type ExpensesExpenseId = string;

/** Represents the table app.expenses */
export default interface ExpensesTable {
  expense_id: ColumnType<ExpensesExpenseId, ExpensesExpenseId | undefined, ExpensesExpenseId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  matter_id: ColumnType<MattersMatterId | null, MattersMatterId | null, MattersMatterId | null>;

  invoice_id: ColumnType<InvoicesInvoiceId | null, InvoicesInvoiceId | null, InvoicesInvoiceId | null>;

  amount: ColumnType<string, string, string>;

  description: ColumnType<string | null, string | null, string | null>;

  is_reimbursable: ColumnType<boolean, boolean | undefined, boolean>;

  billable: ColumnType<boolean, boolean | undefined, boolean>;

  no_charge: ColumnType<boolean, boolean | undefined, boolean>;

  receipt_path: ColumnType<string[], string[] | undefined, string[]>;

  external_invoice_data: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type Expenses = Selectable<ExpensesTable>;

export type NewExpenses = Insertable<ExpensesTable>;

export type ExpensesUpdate = Updateable<ExpensesTable>;