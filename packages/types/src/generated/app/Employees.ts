import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { OfficesOfficeId } from './Offices.js';
import type { JsonValue } from '../../jsonTypes.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app._employees */
export default interface EmployeesTable {
  user_id: ColumnType<auth_UsersId, auth_UsersId, auth_UsersId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  full_legal_name: ColumnType<string, string, string>;

  bar_numbers: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  dashboard_roles: ColumnType<string[], string[] | undefined, string[]>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  deleted_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  deleted_by: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;
}

export type Employees = Selectable<EmployeesTable>;

export type NewEmployees = Insertable<EmployeesTable>;

export type EmployeesUpdate = Updateable<EmployeesTable>;