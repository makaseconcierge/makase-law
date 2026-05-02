import type { OfficesOfficeId } from './Offices.js';
import type { UserProfilesUserId } from './UserProfiles.js';
import type { TeamsTeamId } from './Teams.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table app.employee_teams */
export default interface EmployeeTeamsTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  user_id: ColumnType<UserProfilesUserId, UserProfilesUserId, UserProfilesUserId>;

  team_id: ColumnType<TeamsTeamId, TeamsTeamId, TeamsTeamId>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;
}

export type EmployeeTeams = Selectable<EmployeeTeamsTable>;

export type NewEmployeeTeams = Insertable<EmployeeTeamsTable>;

export type EmployeeTeamsUpdate = Updateable<EmployeeTeamsTable>;