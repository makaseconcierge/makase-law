import type { OfficesOfficeId } from './Offices.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { RolesRoleId } from './Roles.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app.employee_roles */
export default interface EmployeeRolesTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  user_id: ColumnType<auth_UsersId, auth_UsersId, auth_UsersId>;

  role_id: ColumnType<RolesRoleId, RolesRoleId, RolesRoleId>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type EmployeeRoles = Selectable<EmployeeRolesTable>;

export type NewEmployeeRoles = Insertable<EmployeeRolesTable>;

export type EmployeeRolesUpdate = Updateable<EmployeeRolesTable>;