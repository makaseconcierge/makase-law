import type { OfficesOfficeId } from './Offices.js';
import type { TeamsTeamId } from './Teams.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { TeamRolesTeamRoleId } from './TeamRoles.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app.team_member_roles */
export default interface TeamMemberRolesTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  team_id: ColumnType<TeamsTeamId, TeamsTeamId, TeamsTeamId>;

  user_id: ColumnType<auth_UsersId, auth_UsersId, auth_UsersId>;

  team_role_id: ColumnType<TeamRolesTeamRoleId, TeamRolesTeamRoleId, TeamRolesTeamRoleId>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type TeamMemberRoles = Selectable<TeamMemberRolesTable>;

export type NewTeamMemberRoles = Insertable<TeamMemberRolesTable>;

export type TeamMemberRolesUpdate = Updateable<TeamMemberRolesTable>;