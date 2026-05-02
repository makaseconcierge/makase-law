import type { OfficesOfficeId } from './Offices.js';
import type { UserProfilesUserId } from './UserProfiles.js';
import type { RolesRoleId } from './Roles.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app.employee_roles */
export default interface EmployeeRolesTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  user_id: ColumnType<UserProfilesUserId, UserProfilesUserId, UserProfilesUserId>;

  role_id: ColumnType<RolesRoleId, RolesRoleId, RolesRoleId>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;
}

export type EmployeeRoles = Selectable<EmployeeRolesTable>;

export type NewEmployeeRoles = Insertable<EmployeeRolesTable>;

export type EmployeeRolesUpdate = Updateable<EmployeeRolesTable>;