import type { OfficesOfficeId } from './Offices.js';
import type { JsonValue } from '../../json-types.js';
import type { UserProfilesUserId } from './UserProfiles.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.entities */
export type EntitiesEntityId = string;

/** Represents the table app.entities */
export default interface EntitiesTable {
  entity_id: ColumnType<EntitiesEntityId, EntitiesEntityId | undefined, EntitiesEntityId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  full_legal_name: ColumnType<string, string, string>;

  email: ColumnType<string | null, string | null, string | null>;

  phone: ColumnType<string | null, string | null, string | null>;

  entity_type: ColumnType<string, string | undefined, string>;

  metadata: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;
}

export type Entities = Selectable<EntitiesTable>;

export type NewEntities = Insertable<EntitiesTable>;

export type EntitiesUpdate = Updateable<EntitiesTable>;