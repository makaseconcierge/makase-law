import type { OfficesOfficeId } from './Offices.js';
import type { MattersMatterId } from './Matters.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { TeamRolesTeamRoleId } from './TeamRoles.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app.matter_access */
export default interface MatterAccessTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  matter_id: ColumnType<MattersMatterId, MattersMatterId, MattersMatterId>;

  user_id: ColumnType<auth_UsersId, auth_UsersId, auth_UsersId>;

  team_role_id: ColumnType<TeamRolesTeamRoleId, TeamRolesTeamRoleId, TeamRolesTeamRoleId>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type MatterAccess = Selectable<MatterAccessTable>;

export type NewMatterAccess = Insertable<MatterAccessTable>;

export type MatterAccessUpdate = Updateable<MatterAccessTable>;