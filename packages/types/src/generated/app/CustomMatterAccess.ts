import type { OfficesOfficeId } from './Offices.js';
import type { MattersMatterId } from './Matters.js';
import type { UserProfilesUserId } from './UserProfiles.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app._custom_matter_access */
export default interface CustomMatterAccessTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  matter_id: ColumnType<MattersMatterId, MattersMatterId, MattersMatterId>;

  user_id: ColumnType<UserProfilesUserId, UserProfilesUserId, UserProfilesUserId>;

  access_modifier: ColumnType<string, string, string>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  matter_is_deleted: ColumnType<boolean, boolean | undefined, boolean>;

  matter_is_archived: ColumnType<boolean, boolean | undefined, boolean>;
}

export type CustomMatterAccess = Selectable<CustomMatterAccessTable>;

export type NewCustomMatterAccess = Insertable<CustomMatterAccessTable>;

export type CustomMatterAccessUpdate = Updateable<CustomMatterAccessTable>;