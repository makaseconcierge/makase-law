import type { OfficesOfficeId } from './Offices.js';
import type { EntitiesEntityId } from './Entities.js';
import type { MattersMatterId } from './Matters.js';
import type { JsonValue } from '../../jsonTypes.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app._forms */
export type FormsFormId = string;

/** Represents the table app._forms */
export default interface FormsTable {
  form_id: ColumnType<FormsFormId, FormsFormId | undefined, FormsFormId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  entity_id: ColumnType<EntitiesEntityId, EntitiesEntityId, EntitiesEntityId>;

  matter_id: ColumnType<MattersMatterId | null, MattersMatterId | null, MattersMatterId | null>;

  form_type: ColumnType<string, string, string>;

  form_data: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  status: ColumnType<string, string | undefined, string>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  deleted_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  deleted_by: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;
}

export type Forms = Selectable<FormsTable>;

export type NewForms = Insertable<FormsTable>;

export type FormsUpdate = Updateable<FormsTable>;