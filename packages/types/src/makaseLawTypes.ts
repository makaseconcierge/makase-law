import type { Offices, NewOffices } from "./generated/app/Offices.js";
import type { Employees, NewEmployees } from "./generated/app/Employees.js";
import type { Matters, NewMatters } from "./generated/app/Matters.js";
import type { MatterStaff, NewMatterStaff } from "./generated/app/MatterStaff.js";
import type { TimeEntries, NewTimeEntries } from "./generated/app/TimeEntries.js";
import type { Leads, NewLeads } from "./generated/app/Leads.js";
import type { Tasks, NewTasks } from "./generated/app/Tasks.js";
import type { Invoices, NewInvoices } from "./generated/app/Invoices.js";
import type { Expenses, NewExpenses } from "./generated/app/Expenses.js";
import type { InvoicePayments, NewInvoicePayments } from "./generated/app/InvoicePayments.js";
import type { Forms, NewForms } from "./generated/app/Forms.js";
import type { Users } from "./generated/auth/Users.js";

/**
 * Columns owned exclusively by the `set_audit_fields` trigger. Callers
 * must never INSERT or UPDATE these directly — the trigger overwrites
 * whatever is passed. Strip them from every write-shape alias below so
 * the TS boundary matches the DB contract.
 *
 * `deleted_at` / `deleted_by` are also stripped: soft-delete belongs in
 * explicit `softDelete(...)` / `restore(...)` service methods, not in a
 * generic update patch or insert shape.
 */
type AuditColumns =
  | "created_at"
  | "created_by"
  | "updated_at"
  | "updated_by"
  | "deleted_at"
  | "deleted_by";

export type Office = Offices;
export type NewOffice = Omit<NewOffices, AuditColumns>;
export type OfficePatch = Partial<Omit<Office, AuditColumns | "office_id">>;

export type Employee = Employees;
export type NewEmployee = Omit<NewEmployees, AuditColumns>;
export type EmployeePatch = Partial<Omit<Employee, AuditColumns | "user_id" | "office_id">>;

export type Matter = Matters;
export type NewMatter = Omit<NewMatters, AuditColumns | "office_id">;
export type MatterPatch = Partial<Omit<Matter, AuditColumns | "matter_id" | "office_id">>;

export type MatterStaffMember = MatterStaff;
export type NewMatterStaffMember = Omit<NewMatterStaff, AuditColumns | "office_id">;
export type MatterStaffPatch = Partial<Omit<MatterStaffMember, AuditColumns | "office_id" | "matter_id" | "user_id" | "role">>;

export type TimeEntry = TimeEntries;
export type NewTimeEntry = Omit<NewTimeEntries, AuditColumns | "office_id">;
export type TimeEntryPatch = Partial<Omit<TimeEntry, AuditColumns | "time_entry_id" | "office_id">>;

export type Lead = Leads;
export type NewLead = Omit<NewLeads, AuditColumns | "office_id">;
export type LeadPatch = Partial<Omit<Lead, AuditColumns | "lead_id" | "office_id">>;

export type Task = Tasks;
export type NewTask = Omit<NewTasks, AuditColumns | "office_id">;
export type TaskPatch = Partial<Omit<Task, AuditColumns | "task_id" | "office_id">>;

export type Invoice = Invoices;
export type NewInvoice = Omit<NewInvoices, AuditColumns | "office_id">;
export type InvoicePatch = Partial<Omit<Invoice, AuditColumns | "invoice_id" | "office_id">>;

export type Expense = Expenses;
export type NewExpense = Omit<NewExpenses, AuditColumns | "office_id">;
export type ExpensePatch = Partial<Omit<Expense, AuditColumns | "expense_id" | "office_id">>;

export type InvoicePayment = InvoicePayments;
export type NewInvoicePayment = Omit<NewInvoicePayments, AuditColumns | "office_id">;
export type InvoicePaymentPatch = Partial<Omit<InvoicePayment, AuditColumns | "invoice_payment_id" | "office_id">>;

export type Form = Forms;
export type NewForm = Omit<NewForms, AuditColumns | "office_id">;
export type FormPatch = Partial<Omit<Form, AuditColumns | "form_id" | "office_id">>;

export type AuthUser = Users;
