import type { Offices, NewOffices } from "./generated/app/Offices.js";
import type { Employees, NewEmployees } from "./generated/app/Employees.js";
import type { Matters, NewMatters } from "./generated/app/Matters.js";
import type { Teams, NewTeams } from "./generated/app/Teams.js";
import type { Roles, NewRoles } from "./generated/app/Roles.js";
import type { EmployeeRoles, NewEmployeeRoles } from "./generated/app/EmployeeRoles.js";
import type { EmployeeTeams, NewEmployeeTeams } from "./generated/app/EmployeeTeams.js";
import type { Entities, NewEntities } from "./generated/app/Entities.js";
import type { EntityRoles, NewEntityRoles } from "./generated/app/EntityRoles.js";
import type { TimeEntries, NewTimeEntries } from "./generated/app/TimeEntries.js";
import type { Leads, NewLeads } from "./generated/app/Leads.js";
import type { Tasks, NewTasks } from "./generated/app/Tasks.js";
import type { Invoices, NewInvoices } from "./generated/app/Invoices.js";
import type { Expenses, NewExpenses } from "./generated/app/Expenses.js";
import type { InvoicePayments, NewInvoicePayments } from "./generated/app/InvoicePayments.js";
import type { UserProfiles } from "./generated/app/UserProfiles.js";
import type { Users } from "./generated/auth/Users.js";
export * from "./custom/Permissions.js";

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

type DatesToStrings<T> = {
  [K in keyof T]: T[K] extends Date 
    ? Date | string 
    : T[K]
};

export type Office = DatesToStrings<Offices>;
export type NewOffice = Omit<NewOffices, AuditColumns>;
export type OfficePatch = Partial<Omit<Office, AuditColumns | "office_id">>;

export type Employee = DatesToStrings<Employees>;
export type NewEmployee = Omit<NewEmployees, AuditColumns>;
export type EmployeePatch = Partial<Omit<Employee, AuditColumns | "user_id" | "office_id">>;

export type Matter = DatesToStrings<Matters>;
export type NewMatter = Omit<NewMatters, AuditColumns | "office_id">;
export type MatterPatch = Partial<Omit<Matter, AuditColumns | "matter_id" | "office_id">>;

export type Team = DatesToStrings<Teams>;
export type NewTeam = Omit<NewTeams, AuditColumns | "office_id">;
export type TeamPatch = Partial<Omit<Team, AuditColumns | "team_id" | "office_id">>;

export type Role = DatesToStrings<Roles>;
export type NewRole = Omit<NewRoles, AuditColumns | "office_id">;
export type RolePatch = Partial<Omit<Role, AuditColumns | "role_id" | "office_id">>;

export type EmployeeRole = DatesToStrings<EmployeeRoles>;
export type NewEmployeeRole = Omit<NewEmployeeRoles, AuditColumns | "office_id">;
export type EmployeeRolePatch = Partial<Omit<EmployeeRole, AuditColumns | "employee_role_id" | "office_id">>;

export type EmployeeTeam = DatesToStrings<EmployeeTeams>;
export type NewEmployeeTeam = Omit<NewEmployeeTeams, AuditColumns | "office_id">;
export type EmployeeTeamPatch = Partial<Omit<EmployeeTeam, AuditColumns | "employee_team_id" | "office_id">>;

export type Entity = DatesToStrings<Entities>;
export type NewEntity = Omit<NewEntities, AuditColumns | "office_id">;
export type EntityPatch = Partial<Omit<Entity, AuditColumns | "entity_id" | "office_id">>;

export type EntityRoleLink = DatesToStrings<EntityRoles>;
export type NewEntityRoleLink = Omit<NewEntityRoles, AuditColumns | "office_id">;

export type TimeEntry = DatesToStrings<TimeEntries>;
export type NewTimeEntry = Omit<NewTimeEntries, AuditColumns | "office_id">;
export type TimeEntryPatch = Partial<Omit<TimeEntry, AuditColumns | "time_entry_id" | "office_id">>;

export type Lead = DatesToStrings<Leads>;
export type NewLead = Omit<NewLeads, AuditColumns | "office_id">;
export type LeadPatch = Partial<Omit<Lead, AuditColumns | "lead_id" | "office_id">>;

export type Task = DatesToStrings<Tasks>;
export type NewTask = Omit<NewTasks, AuditColumns | "office_id">;
export type TaskPatch = Partial<Omit<Task, AuditColumns | "task_id" | "office_id">>;

export type Invoice = DatesToStrings<Invoices>;
export type NewInvoice = Omit<NewInvoices, AuditColumns | "office_id">;
export type InvoicePatch = Partial<Omit<Invoice, AuditColumns | "invoice_id" | "office_id">>;

export type Expense = DatesToStrings<Expenses>;
export type NewExpense = Omit<NewExpenses, AuditColumns | "office_id">;
export type ExpensePatch = Partial<Omit<Expense, AuditColumns | "expense_id" | "office_id">>;

export type InvoicePayment = DatesToStrings<InvoicePayments>;
export type NewInvoicePayment = Omit<NewInvoicePayments, AuditColumns | "office_id">;
export type InvoicePaymentPatch = Partial<Omit<InvoicePayment, AuditColumns | "invoice_payment_id" | "office_id">>;

export type UserProfile = DatesToStrings<UserProfiles>;

export type AuthUser = Users;
