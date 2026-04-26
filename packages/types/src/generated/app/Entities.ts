import type { OfficesOfficeId } from './Offices.js';
import type { JsonValue } from '../../jsonTypes.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
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

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type Entities = Selectable<EntitiesTable>;

export type NewEntities = Insertable<EntitiesTable>;

export type EntitiesUpdate = Updateable<EntitiesTable>;