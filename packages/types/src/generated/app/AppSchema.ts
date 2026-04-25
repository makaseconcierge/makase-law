import type { default as AuditLogTable } from './AuditLog.js';
import type { default as EntitiesTable } from './Entities.js';
import type { default as FormsTable } from './Forms.js';
import type { default as UserProfilesTable } from './UserProfiles.js';
import type { default as EmployeesTable } from './Employees.js';
import type { default as InvoicePaymentsTable } from './InvoicePayments.js';
import type { default as TeamRolesTable } from './TeamRoles.js';
import type { default as InvoicesTable } from './Invoices.js';
import type { default as TasksTable } from './Tasks.js';
import type { default as TeamsTable } from './Teams.js';
import type { default as OfficesTable } from './Offices.js';
import type { default as TimeEntriesTable } from './TimeEntries.js';
import type { default as TeamMemberRolesTable } from './TeamMemberRoles.js';
import type { default as EntityRolesTable } from './EntityRoles.js';
import type { default as ExpensesTable } from './Expenses.js';
import type { default as MattersTable } from './Matters.js';
import type { default as LeadsTable } from './Leads.js';
import type { default as MatterStaffTable } from './MatterStaff.js';

export default interface AppSchema {
  audit_log: AuditLogTable;

  _entities: EntitiesTable;

  _forms: FormsTable;

  _user_profiles: UserProfilesTable;

  _employees: EmployeesTable;

  _invoice_payments: InvoicePaymentsTable;

  _team_roles: TeamRolesTable;

  _invoices: InvoicesTable;

  _tasks: TasksTable;

  _teams: TeamsTable;

  _offices: OfficesTable;

  _time_entries: TimeEntriesTable;

  _team_member_roles: TeamMemberRolesTable;

  _entity_roles: EntityRolesTable;

  _expenses: ExpensesTable;

  _matters: MattersTable;

  _leads: LeadsTable;

  _matter_staff: MatterStaffTable;

  entities: EntitiesTable;

  forms: FormsTable;

  user_profiles: UserProfilesTable;

  employees: EmployeesTable;

  invoice_payments: InvoicePaymentsTable;

  team_roles: TeamRolesTable;

  invoices: InvoicesTable;

  tasks: TasksTable;

  teams: TeamsTable;

  offices: OfficesTable;

  time_entries: TimeEntriesTable;

  team_member_roles: TeamMemberRolesTable;

  entity_roles: EntityRolesTable;

  expenses: ExpensesTable;

  matters: MattersTable;

  leads: LeadsTable;

  matter_staff: MatterStaffTable;
}