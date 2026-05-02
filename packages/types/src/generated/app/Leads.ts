import type { OfficesOfficeId } from './Offices.js';
import type { TeamsTeamId } from './Teams.js';
import type { JsonValue } from '../../json-types.js';
import type { EntitiesEntityId } from './Entities.js';
import type { UserProfilesUserId } from './UserProfiles.js';
import type { MattersMatterId } from './Matters.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.leads */
export type LeadsLeadId = string;

/** Represents the table app.leads */
export default interface LeadsTable {
  lead_id: ColumnType<LeadsLeadId, LeadsLeadId | undefined, LeadsLeadId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  team_id: ColumnType<TeamsTeamId, TeamsTeamId, TeamsTeamId>;

  full_legal_name: ColumnType<string | null, string | null, string | null>;

  phone: ColumnType<string | null, string | null, string | null>;

  email: ColumnType<string | null, string | null, string | null>;

  lead_source: ColumnType<string | null, string | null, string | null>;

  lead_source_data: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  stage: ColumnType<string, string | undefined, string>;

  existing_entity_id: ColumnType<EntitiesEntityId | null, EntitiesEntityId | null, EntitiesEntityId | null>;

  entity_search_results: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  matter_type: ColumnType<string | null, string | null, string | null>;

  opposing_party_names: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  other_entity_names: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  conflict_search_results: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  existing_entity_check_passed_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  existing_entity_check_passed_by: ColumnType<UserProfilesUserId | null, UserProfilesUserId | null, UserProfilesUserId | null>;

  conflict_check_passed_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  conflict_check_passed_by: ColumnType<UserProfilesUserId | null, UserProfilesUserId | null, UserProfilesUserId | null>;

  matter_data: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  score: ColumnType<string | null, string | null, string | null>;

  suggested_attorney_user_id: ColumnType<UserProfilesUserId | null, UserProfilesUserId | null, UserProfilesUserId | null>;

  assigned_attorney_user_id: ColumnType<UserProfilesUserId | null, UserProfilesUserId | null, UserProfilesUserId | null>;

  consultation_scheduled_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  fee_agreement_status: ColumnType<string | null, string | null, string | null>;

  entity_id: ColumnType<EntitiesEntityId | null, EntitiesEntityId | null, EntitiesEntityId | null>;

  matter_id: ColumnType<MattersMatterId | null, MattersMatterId | null, MattersMatterId | null>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;
}

export type Leads = Selectable<LeadsTable>;

export type NewLeads = Insertable<LeadsTable>;

export type LeadsUpdate = Updateable<LeadsTable>;