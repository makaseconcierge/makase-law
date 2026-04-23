import type { OfficesOfficeId } from './Offices.js';
import type { MattersMatterId } from './Matters.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app._matter_staff */
export type MatterStaffRole = string;

/** Represents the table app._matter_staff */
export default interface MatterStaffTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  matter_id: ColumnType<MattersMatterId, MattersMatterId, MattersMatterId>;

  user_id: ColumnType<auth_UsersId, auth_UsersId, auth_UsersId>;

  role: ColumnType<MatterStaffRole, MatterStaffRole | undefined, MatterStaffRole>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  deleted_at: ColumnType<Date | null, Date | string | null, Date | string | null>;

  deleted_by: ColumnType<auth_UsersId | null, auth_UsersId | null, auth_UsersId | null>;
}

export type MatterStaff = Selectable<MatterStaffTable>;

export type NewMatterStaff = Insertable<MatterStaffTable>;

export type MatterStaffUpdate = Updateable<MatterStaffTable>;