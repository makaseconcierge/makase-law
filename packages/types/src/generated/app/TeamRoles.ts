import type { OfficesOfficeId } from './Offices.js';
import type { JsonValue } from '../../jsonTypes.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.team_roles */
export type TeamRolesTeamRoleId = string;

/** Represents the table app.team_roles */
export default interface TeamRolesTable {
  team_role_id: ColumnType<TeamRolesTeamRoleId, TeamRolesTeamRoleId | undefined, TeamRolesTeamRoleId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  name: ColumnType<string, string, string>;

  description: ColumnType<string, string, string>;

  role_config: ColumnType<JsonValue, JsonValue | undefined, JsonValue>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type TeamRoles = Selectable<TeamRolesTable>;

export type NewTeamRoles = Insertable<TeamRolesTable>;

export type TeamRolesUpdate = Updateable<TeamRolesTable>;