import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app._user_profiles */
export default interface UserProfilesTable {
  user_id: ColumnType<auth_UsersId, auth_UsersId, auth_UsersId>;

  display_name: ColumnType<string, string, string>;

  email: ColumnType<string, string, string>;

  phone: ColumnType<string | null, string | null, string | null>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  deleted_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  deleted_by: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;
}

export type UserProfiles = Selectable<UserProfilesTable>;

export type NewUserProfiles = Insertable<UserProfilesTable>;

export type UserProfilesUpdate = Updateable<UserProfilesTable>;