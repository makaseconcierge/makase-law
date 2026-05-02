import type { OfficesOfficeId } from './Offices.js';
import type { Permissions } from '../../custom/Permissions.js';
import type { UserProfilesUserId } from './UserProfiles.js';
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

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;
}

export type Roles = Selectable<RolesTable>;

export type NewRoles = Insertable<RolesTable>;

export type RolesUpdate = Updateable<RolesTable>;