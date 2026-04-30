import type { OfficesOfficeId } from './Offices.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { TeamsTeamId } from './Teams.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app.employee_teams */
export default interface EmployeeTeamsTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  user_id: ColumnType<auth_UsersId, auth_UsersId, auth_UsersId>;

  team_id: ColumnType<TeamsTeamId, TeamsTeamId, TeamsTeamId>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type EmployeeTeams = Selectable<EmployeeTeamsTable>;

export type NewEmployeeTeams = Insertable<EmployeeTeamsTable>;

export type EmployeeTeamsUpdate = Updateable<EmployeeTeamsTable>;