import { SYSTEM_USER_ID } from "./runAs";

/**
 * Placeholder values for the NOT NULL audit columns (`created_by`,
 * `updated_by`) that `kysely-codegen` can't mark `Generated<>` because
 * they have no SQL DEFAULT. The `set_audit_fields` trigger overwrites
 * both in BEFORE INSERT, so these values never survive to the stored
 * row — any valid user_id would do, but `SYSTEM_USER_ID` makes the
 * intent obvious.
 *
 * Spread into every `insertInto(...).values({...})` call:
 *
 *   .values({ ...data, office_id, ...auditPlaceholder })
 *
 * Why not add SQL DEFAULTs? It would work but would put a lie in the
 * schema ("this column defaults to SYSTEM") — the trigger is the real
 * source of truth for audit attribution.
 */
export const auditPlaceholder = {
  created_by: SYSTEM_USER_ID,
  updated_by: SYSTEM_USER_ID,
} as const;
