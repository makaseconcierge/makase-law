import type { OfficesOfficeId } from './Offices.js';
import type { EntitiesEntityId } from './Entities.js';
import type { MattersMatterId } from './Matters.js';
import type { UserProfilesUserId } from './UserProfiles.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app._entity_roles */
export type EntityRolesMatterRole = string;

/** Represents the table app._entity_roles */
export default interface EntityRolesTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  entity_id: ColumnType<EntitiesEntityId, EntitiesEntityId, EntitiesEntityId>;

  matter_id: ColumnType<MattersMatterId, MattersMatterId, MattersMatterId>;

  matter_role: ColumnType<EntityRolesMatterRole, EntityRolesMatterRole, EntityRolesMatterRole>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<UserProfilesUserId, UserProfilesUserId | undefined, UserProfilesUserId>;

  matter_is_deleted: ColumnType<boolean, boolean | undefined, boolean>;

  matter_is_archived: ColumnType<boolean, boolean | undefined, boolean>;
}

export type EntityRoles = Selectable<EntityRolesTable>;

export type NewEntityRoles = Insertable<EntityRolesTable>;

export type EntityRolesUpdate = Updateable<EntityRolesTable>;