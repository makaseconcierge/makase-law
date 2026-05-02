import type { JsonValue } from '../../json-types.js';
import type { UserProfilesUserId } from './UserProfiles.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.offices */
export type OfficesOfficeId = string;

/** Represents the table app.offices */
export default interface OfficesTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId | undefined, OfficesOfficeId>;

  slug: ColumnType<string, string, string>;

  name: ColumnType<string, string, string>;

  address: ColumnType<JsonValue | null, JsonValue | null, JsonValue | null>;

  phone: ColumnType<string | null, string | null, string | null>;

  email: ColumnType<string | null, string | null, string | null>;

  website: ColumnType<string | null, string | null, string | null>;

  logo: ColumnType<string | null, string | null, string | null>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;
}

export type Offices = Selectable<OfficesTable>;

export type NewOffices = Insertable<OfficesTable>;

export type OfficesUpdate = Updateable<OfficesTable>;