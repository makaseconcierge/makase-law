import { sql } from "kysely";
import { rootDb, txStorage } from "./dbClient";

/**
 * Well-known user_id for unattended processes (cron, migrations, admin
 * scripts). Seeded in the core_tables migration. Use `runAsSystem(fn)`
 * rather than referencing this UUID directly at callsites.
 */
export const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Executes `fn` inside a single database transaction attributed to
 * `actingUserId`. The attribution is set on the pinned connection via
 * `set_config('app.acting_user_id', ..., true)`, which the BEFORE
 * INSERT/UPDATE trigger on every `app._*` table reads to populate
 * `created_by`/`updated_by`/`deleted_by`.
 *
 * Semantics:
 *  - All Kysely queries inside `fn` that go through `getDb()` run on the
 *    same connection inside the same transaction. Reads see uncommitted
 *    writes from earlier in the same scope.
 *  - A thrown error rolls back the transaction; the attribution GUC is
 *    automatically cleared because it was set with `is_local = true`.
 *  - Nested `runAs` calls are a no-op: the outer transaction and
 *    attribution win. Do not rely on nested calls to swap actors.
 */
export async function runAs<T>(
  actingUserId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = txStorage.getStore();
  if (existing) return fn();

  return rootDb.transaction().execute(async (trx) => {
    await sql`SELECT set_config('app.acting_user_id', ${actingUserId}, true)`.execute(trx);
    return txStorage.run(trx, fn);
  });
}

/**
 * Convenience wrapper for unattended writes. Uses `SYSTEM_USER_ID`.
 */
export function runAsSystem<T>(fn: () => Promise<T>): Promise<T> {
  return runAs(SYSTEM_USER_ID, fn);
}

/**
 * Returns the current acting user_id if called inside a `runAs` scope,
 * or `null` otherwise. Most code should never need this — the DB trigger
 * handles attribution. Use only when application logic genuinely needs
 * to branch on "who's doing this."
 */
export async function getActingUserId(): Promise<string | null> {
  const trx = txStorage.getStore();
  if (!trx) return null;
  const result = await sql<{ setting: string | null }>`SELECT current_setting('app.acting_user_id', true) AS setting`.execute(trx);
  return result.rows[0]?.setting ?? null;
}
