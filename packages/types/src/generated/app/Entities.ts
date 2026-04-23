import type { OfficesOfficeId } from './Offices.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { JsonValue } from '../../jsonTypes.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app._entities */
export type EntitiesEntityId = string;

/** Represents the table app._entities */
export default interface EntitiesTable {
  entity_id: ColumnType<EntitiesEntityId, EntitiesEntityId | undefined, EntitiesEntityId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  user_id: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;

  full_legal_name: ColumnType<string, string, string>;

  email: ColumnType<string | null, string | null, string | null>;

  phone: ColumnType<string | null, string | null, string | null>;

  entity_type: ColumnType<string, string | undefined, string>;

  metadata: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  deleted_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  deleted_by: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;
}

export type Entities = Selectable<EntitiesTable>;

export type NewEntities = Insertable<EntitiesTable>;

export type EntitiesUpdate = Updateable<EntitiesTable>;