import type { DB as _DB } from "./dbTypes";

/**
 * Remap every view `foo` in the generated DB to its underlying table
 * type `_foo`. Postgres doesn't propagate NOT NULL through views, so
 * codegen reports view columns as nullable even though the view is
 * `SELECT * FROM _foo WHERE deleted_at IS NULL` and the column types
 * match the table exactly. Kysely looks up `DB["foo"]` when queries
 * use the view name, so remapping here gives every service the correct
 * NOT NULL / Generated<...> typing without any codegen postprocessing.
 *
 * Tables without a corresponding view (none today) pass through unchanged.
 */
type RemapViews<T> = {
  [K in keyof T]: `_${K & string}` extends keyof T
    ? T[`_${K & string}`]
    : T[K];
};

export type DB = RemapViews<_DB>;
