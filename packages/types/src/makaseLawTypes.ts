import type { Selectable } from "kysely";
import type { Offices, Employees, Matters, Invoices, Expenses, InvoicePayments, AuthUsers } from "./dbTypes";

export type Office = Selectable<Offices>;
export type Employee = Selectable<Employees>;
export type AuthUser = Selectable<AuthUsers>;
export type Matter = Selectable<Matters>;
export type Invoice = Selectable<Invoices>;
export type Expense = Selectable<Expenses>;
export type InvoicePayment = Selectable<InvoicePayments>;