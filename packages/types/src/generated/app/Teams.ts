import type { OfficesOfficeId } from './Offices.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.teams */
export type TeamsTeamId = string;

/** Represents the table app.teams */
export default interface TeamsTable {
  team_id: ColumnType<TeamsTeamId, TeamsTeamId | undefined, TeamsTeamId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  name: ColumnType<string, string, string>;

  description: ColumnType<string, string | undefined, string>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type Teams = Selectable<TeamsTable>;

export type NewTeams = Insertable<TeamsTable>;

export type TeamsUpdate = Updateable<TeamsTable>;