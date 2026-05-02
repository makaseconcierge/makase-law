import type { OfficesOfficeId } from './Offices.js';
import type { TeamsTeamId } from './Teams.js';
import type { UserProfilesUserId } from './UserProfiles.js';
import type { JsonValue } from '../../json-types.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app._matters */
export type MattersMatterId = string;

/** Represents the table app._matters */
export default interface MattersTable {
  matter_id: ColumnType<MattersMatterId, MattersMatterId | undefined, MattersMatterId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  team_id: ColumnType<TeamsTeamId, TeamsTeamId, TeamsTeamId>;

  responsible_attorney_id: ColumnType<UserProfilesUserId, UserProfilesUserId, UserProfilesUserId>;

  supervising_attorney_id: ColumnType<UserProfilesUserId | null, UserProfilesUserId | null, UserProfilesUserId | null>;

  non_team_member_ids: ColumnType<string[], string[] | undefined, string[]>;

  title: ColumnType<string, string, string>;

  description: ColumnType<string, string | undefined, string>;

  stage: ColumnType<string, string | undefined, string>;

  type: ColumnType<string, string | undefined, string>;

  billing_type: ColumnType<string, string, string>;

  billing_settings: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  started_representation_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  ended_representation_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  referral_source: ColumnType<string | null, string | null, string | null>;

  referral_id: ColumnType<string | null, string | null, string | null>;

  referral_data: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  preferred_office_location: ColumnType<string, string | undefined, string>;

  data: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  archived_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  archived_by: ColumnType<UserProfilesUserId | null, UserProfilesUserId | null, UserProfilesUserId | null>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  deleted_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  deleted_by: ColumnType<UserProfilesUserId | null, UserProfilesUserId | null, UserProfilesUserId | null>;
}

export type Matters = Selectable<MattersTable>;

export type NewMatters = Insertable<MattersTable>;

export type MattersUpdate = Updateable<MattersTable>;