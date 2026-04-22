import type { Insertable, Selectable } from "kysely";
import type { DB } from "./remappedDB";
import type { AuthUsers } from "./dbTypes";

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

export type Office = Selectable<DB["offices"]>;
export type NewOffice = Omit<Insertable<DB["offices"]>, AuditColumns>;
export type OfficePatch = Partial<Omit<Office, AuditColumns | "office_id">>;

export type Employee = Selectable<DB["employees"]>;
export type NewEmployee = Omit<Insertable<DB["employees"]>, AuditColumns>;
export type EmployeePatch = Partial<Omit<Employee, AuditColumns | "user_id" | "office_id">>;

export type Matter = Selectable<DB["matters"]>;
export type NewMatter = Omit<Insertable<DB["matters"]>, AuditColumns | "office_id">;
export type MatterPatch = Partial<Omit<Matter, AuditColumns | "matter_id" | "office_id">>;

export type MatterStaffMember = Selectable<DB["matter_staff"]>;
export type NewMatterStaffMember = Omit<Insertable<DB["matter_staff"]>, AuditColumns | "office_id">;
export type MatterStaffPatch = Partial<Omit<MatterStaffMember, AuditColumns | "office_id" | "matter_id" | "user_id" | "role">>;

export type TimeEntry = Selectable<DB["time_entries"]>;
export type NewTimeEntry = Omit<Insertable<DB["time_entries"]>, AuditColumns | "office_id">;
export type TimeEntryPatch = Partial<Omit<TimeEntry, AuditColumns | "time_entry_id" | "office_id">>;

export type Lead = Selectable<DB["leads"]>;
export type NewLead = Omit<Insertable<DB["leads"]>, AuditColumns | "office_id">;
export type LeadPatch = Partial<Omit<Lead, AuditColumns | "lead_id" | "office_id">>;

export type Task = Selectable<DB["tasks"]>;
export type NewTask = Omit<Insertable<DB["tasks"]>, AuditColumns | "office_id">;
export type TaskPatch = Partial<Omit<Task, AuditColumns | "task_id" | "office_id">>;

export type Invoice = Selectable<DB["invoices"]>;
export type NewInvoice = Omit<Insertable<DB["invoices"]>, AuditColumns | "office_id">;
export type InvoicePatch = Partial<Omit<Invoice, AuditColumns | "invoice_id" | "office_id">>;

export type Expense = Selectable<DB["expenses"]>;
export type NewExpense = Omit<Insertable<DB["expenses"]>, AuditColumns | "office_id">;
export type ExpensePatch = Partial<Omit<Expense, AuditColumns | "expense_id" | "office_id">>;

export type InvoicePayment = Selectable<DB["invoice_payments"]>;
export type NewInvoicePayment = Omit<Insertable<DB["invoice_payments"]>, AuditColumns | "office_id">;
export type InvoicePaymentPatch = Partial<Omit<InvoicePayment, AuditColumns | "invoice_payment_id" | "office_id">>;

export type Form = Selectable<DB["forms"]>;
export type NewForm = Omit<Insertable<DB["forms"]>, AuditColumns | "office_id">;
export type FormPatch = Partial<Omit<Form, AuditColumns | "form_id" | "office_id">>;

export type AuthUser = Selectable<AuthUsers>;
