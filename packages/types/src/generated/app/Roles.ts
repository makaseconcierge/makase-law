import type { OfficesOfficeId } from './Offices.js';
import type { Permissions } from '../../custom/Permissions.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.roles */
export type RolesRoleId = string;

/** Represents the table app.roles */
export default interface RolesTable {
  role_id: ColumnType<RolesRoleId, RolesRoleId | undefined, RolesRoleId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  name: ColumnType<string, string, string>;

  description: ColumnType<string, string, string>;

  permissions: ColumnType<Permissions, Permissions | undefined, Permissions>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type Roles = Selectable<RolesTable>;

export type NewRoles = Insertable<RolesTable>;

export type RolesUpdate = Updateable<RolesTable>;