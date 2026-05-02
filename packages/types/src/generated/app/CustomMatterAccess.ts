import type { OfficesOfficeId } from './Offices.js';
import type { UserProfilesUserId } from './UserProfiles.js';
import type { MattersMatterId } from './Matters.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app.custom_matter_access */
export default interface CustomMatterAccessTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  user_id: ColumnType<UserProfilesUserId, UserProfilesUserId, UserProfilesUserId>;

  matter_id: ColumnType<MattersMatterId, MattersMatterId, MattersMatterId>;

  matter_archived_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  access_modifier: ColumnType<string, string, string>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;
}

export type CustomMatterAccess = Selectable<CustomMatterAccessTable>;

export type NewCustomMatterAccess = Insertable<CustomMatterAccessTable>;

export type CustomMatterAccessUpdate = Updateable<CustomMatterAccessTable>;