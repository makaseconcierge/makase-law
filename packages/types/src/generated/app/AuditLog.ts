import type { JsonValue } from '../../jsonTypes.js';
import type { UsersId as auth_UsersId } from '../auth/Users.js';
import type { OfficesOfficeId } from './Offices.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.audit_log */
export type AuditLogAuditLogId = string;

/** Represents the table app.audit_log */
export default interface AuditLogTable {
  audit_log_id: ColumnType<AuditLogAuditLogId, AuditLogAuditLogId | undefined, AuditLogAuditLogId>;

  table_schema: ColumnType<string, string, string>;

  table_name: ColumnType<string, string, string>;

  record_pk: ColumnType<JsonValue, JsonValue, JsonValue>;

  op: ColumnType<string, string, string>;

  diff: ColumnType<JsonValue, JsonValue, JsonValue>;

  changed_by: ColumnType<auth_UsersId, auth_UsersId, auth_UsersId>;

  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  changed_at: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type AuditLog = Selectable<AuditLogTable>;

export type NewAuditLog = Insertable<AuditLogTable>;

export type AuditLogUpdate = Updateable<AuditLogTable>;