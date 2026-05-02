import type { UserProfilesUserId } from './UserProfiles.js';
import type { OfficesOfficeId } from './Offices.js';
import type { JsonValue } from '../../json-types.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app._employees */
export default interface EmployeesTable {
  user_id: ColumnType<UserProfilesUserId, UserProfilesUserId, UserProfilesUserId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  full_legal_name: ColumnType<string, string, string>;

  bar_numbers: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  is_admin: ColumnType<boolean, boolean | undefined, boolean>;

  deleted_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  deleted_by: ColumnType<UserProfilesUserId | null, UserProfilesUserId | null, UserProfilesUserId | null>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;
}

export type Employees = Selectable<EmployeesTable>;

export type NewEmployees = Insertable<EmployeesTable>;

export type EmployeesUpdate = Updateable<EmployeesTable>;