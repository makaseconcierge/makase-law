import type { JsonValue } from '../../jsonTypes.js';
import type { OfficeRoleConfig } from '../../officeRoleConfig.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app._offices */
export type OfficesOfficeId = string;

/** Represents the table app._offices */
export default interface OfficesTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId | undefined, OfficesOfficeId>;

  name: ColumnType<string, string, string>;

  address: ColumnType<JsonValue | null, JsonValue | null, JsonValue | null>;

  phone: ColumnType<string | null, string | null, string | null>;

  email: ColumnType<string | null, string | null, string | null>;

  website: ColumnType<string | null, string | null, string | null>;

  logo: ColumnType<string | null, string | null, string | null>;

  role_config: ColumnType<OfficeRoleConfig, OfficeRoleConfig | undefined, OfficeRoleConfig>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  deleted_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  deleted_by: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;
}

export type Offices = Selectable<OfficesTable>;

export type NewOffices = Insertable<OfficesTable>;

export type OfficesUpdate = Updateable<OfficesTable>;