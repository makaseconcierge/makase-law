import type { OfficesOfficeId } from './Offices.js';
import type { EntitiesEntityId } from './Entities.js';
import type { MattersMatterId } from './Matters.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.entity_roles */
export type EntityRolesMatterRole = string;

/** Represents the table app.entity_roles */
export default interface EntityRolesTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  entity_id: ColumnType<EntitiesEntityId, EntitiesEntityId, EntitiesEntityId>;

  matter_id: ColumnType<MattersMatterId, MattersMatterId, MattersMatterId>;

  matter_role: ColumnType<EntityRolesMatterRole, EntityRolesMatterRole, EntityRolesMatterRole>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;

  created_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;

  updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

  updated_by: ColumnType<auth_UsersId, auth_UsersId | undefined, auth_UsersId>;
}

export type EntityRoles = Selectable<EntityRolesTable>;

export type NewEntityRoles = Insertable<EntityRolesTable>;

export type EntityRolesUpdate = Updateable<EntityRolesTable>;