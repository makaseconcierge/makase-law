import type { default as AuditLogTable } from './AuditLog.js';
import type { default as EntityRolesTable } from './EntityRoles.js';
import type { default as MatterStaffTable } from './MatterStaff.js';
import type { default as EmployeesTable } from './Employees.js';
import type { default as TeamRolesTable } from './TeamRoles.js';
import type { default as EntitiesTable } from './Entities.js';
import type { default as TeamMemberRolesTable } from './TeamMemberRoles.js';
import type { default as InvoicePaymentsTable } from './InvoicePayments.js';
import type { default as ExpensesTable } from './Expenses.js';
import type { default as TimeEntriesTable } from './TimeEntries.js';
import type { default as InvoicesTable } from './Invoices.js';
import type { default as TasksTable } from './Tasks.js';
import type { default as TeamsTable } from './Teams.js';
import type { default as LeadsTable } from './Leads.js';
import type { default as OfficesTable } from './Offices.js';
import type { default as UserProfilesTable } from './UserProfiles.js';
import type { default as MattersTable } from './Matters.js';

export default interface AppSchema {
  audit_log: AuditLogTable;

  entity_roles: EntityRolesTable;

  matter_staff: MatterStaffTable;

  _employees: EmployeesTable;

  team_roles: TeamRolesTable;

  entities: EntitiesTable;

  team_member_roles: TeamMemberRolesTable;

  invoice_payments: InvoicePaymentsTable;

  expenses: ExpensesTable;

  time_entries: TimeEntriesTable;

  invoices: InvoicesTable;

  tasks: TasksTable;

  teams: TeamsTable;

  leads: LeadsTable;

  offices: OfficesTable;

  user_profiles: UserProfilesTable;

  _matters: MattersTable;

  employees: EmployeesTable;

  matters: MattersTable;
}