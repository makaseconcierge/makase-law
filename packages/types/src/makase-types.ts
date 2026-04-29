import type { Offices, NewOffices } from "./generated/app/Offices.js";
import type { Employees, NewEmployees } from "./generated/app/Employees.js";
import type { Matters, NewMatters } from "./generated/app/Matters.js";
import type { Teams, NewTeams } from "./generated/app/Teams.js";
import type { TeamRoles, NewTeamRoles } from "./generated/app/TeamRoles.js";
import type { TeamMemberRoles, NewTeamMemberRoles } from "./generated/app/TeamMemberRoles.js";
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
export * from "./custom/RoleConfig.js";

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

export type Team = Teams;
export type NewTeam = Omit<NewTeams, AuditColumns | "office_id">;
export type TeamPatch = Partial<Omit<Team, AuditColumns | "team_id" | "office_id">>;



export type TeamRole = TeamRoles;
export type NewTeamRole = Omit<NewTeamRoles, AuditColumns | "office_id">;
export type TeamRolePatch = Partial<Omit<NewTeamRole, AuditColumns | "team_role_id">>


// Composite-PK link tables: nothing to patch once a row is created — the
// row itself is the membership. Surface only the readable + insert shapes.
export type TeamMemberRole = TeamMemberRoles;
export type NewTeamMemberRole = Omit<NewTeamMemberRoles, AuditColumns | "office_id">;

export type Entity = Entities;
export type NewEntity = Omit<NewEntities, AuditColumns | "office_id">;
export type EntityPatch = Partial<Omit<Entity, AuditColumns | "entity_id" | "office_id">>;

export type EntityRoleLink = EntityRoles;
export type NewEntityRoleLink = Omit<NewEntityRoles, AuditColumns | "office_id">;

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

export type UserProfile = UserProfiles;

export type AuthUser = Users;
