import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app.user_profiles */
export default interface UserProfilesTable {
  user_id: ColumnType<auth_UsersId, auth_UsersId, auth_UsersId>;

  display_name: ColumnType<string, string, string>;

  email: ColumnType<string, string, string>;

  phone: ColumnType<string | null, string | null, string | null>;
}

export type UserProfiles = Selectable<UserProfilesTable>;

export type NewUserProfiles = Insertable<UserProfilesTable>;

export type UserProfilesUpdate = Updateable<UserProfilesTable>;