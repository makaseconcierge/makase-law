import type { OfficesOfficeId } from './Offices.js';
import type { TeamsTeamId } from './Teams.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { JsonValue } from '../../json-types.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app._matters */
export type MattersMatterId = string;

/** Represents the table app._matters */
export default interface MattersTable {
  matter_id: ColumnType<MattersMatterId, MattersMatterId | undefined, MattersMatterId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  team_id: ColumnType<TeamsTeamId, TeamsTeamId, TeamsTeamId>;

  responsible_attorney_id: ColumnType<auth_UsersId, auth_UsersId, auth_UsersId>;

  supervising_attorney_id: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;

  title: ColumnType<string, string, string>;

  description: ColumnType<string, string | undefined, string>;

  stage: ColumnType<string, string | undefined, string>;

  type: ColumnType<string, string | undefined, string>;

  billing_type: ColumnType<string, string | undefined, string>;

  billing_settings: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  started_representation_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  ended_representation_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  referral_source: ColumnType<string | null, string | null, string | null>;

  referral_id: ColumnType<string | null, string | null, string | null>;

  referral_data: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  preferred_office_location: ColumnType<string, string | undefined, string>;

  data: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  archived_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  archived_by: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  deleted_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  deleted_by: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;
}

export type Matters = Selectable<MattersTable>;

export type NewMatters = Insertable<MattersTable>;

export type MattersUpdate = Updateable<MattersTable>;