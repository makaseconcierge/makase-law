import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.user_profiles */
export type UserProfilesUserId = string;

/** Represents the table app.user_profiles */
export default interface UserProfilesTable {
  user_id: ColumnType<UserProfilesUserId, UserProfilesUserId, UserProfilesUserId>;

  display_name: ColumnType<string, string, string>;

  email: ColumnType<string, string, string>;

  phone: ColumnType<string | null, string | null, string | null>;
}

export type UserProfiles = Selectable<UserProfilesTable>;

export type NewUserProfiles = Insertable<UserProfilesTable>;

export type UserProfilesUpdate = Updateable<UserProfilesTable>;