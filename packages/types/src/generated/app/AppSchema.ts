import type { default as AuditLogTable } from './AuditLog.js';
import type { default as EntitiesTable } from './Entities.js';
import type { default as FormsTable } from './Forms.js';
import type { default as UserProfilesTable } from './UserProfiles.js';
import type { default as EmployeesTable } from './Employees.js';
import type { default as InvoicePaymentsTable } from './InvoicePayments.js';
import type { default as InvoicesTable } from './Invoices.js';
import type { default as TasksTable } from './Tasks.js';
import type { default as PositionsTable } from './Positions.js';
import type { default as OfficesTable } from './Offices.js';
import type { default as TimeEntriesTable } from './TimeEntries.js';
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

  _invoices: InvoicesTable;

  _tasks: TasksTable;

  positions: PositionsTable;

  _offices: OfficesTable;

  _time_entries: TimeEntriesTable;

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

  invoices: InvoicesTable;

  tasks: TasksTable;

  offices: OfficesTable;

  time_entries: TimeEntriesTable;

  entity_roles: EntityRolesTable;

  expenses: ExpensesTable;

  matters: MattersTable;

  leads: LeadsTable;

  matter_staff: MatterStaffTable;
}