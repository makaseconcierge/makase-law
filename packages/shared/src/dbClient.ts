import { SQL } from "bun";
import { AsyncLocalStorage } from "node:async_hooks";
import { Kysely, type Transaction } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import type { DB } from "@makase-law/types";

/**
 * Root pool-backed Kysely client. Used directly only by `runAs` to open
 * per-scope transactions, and by read-only GET handlers that have no
 * AsyncLocalStorage context. Do not import this directly from services —
 * use `getDb()` so the correct per-request transaction is picked up.
 */
export const rootDb = new Kysely<DB>({
  dialect: new PostgresJSDialect({
    postgres: new SQL({
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 54322),
      database: process.env.DB_NAME ?? "postgres",
      user: process.env.DB_USER ?? "postgres",
      password: process.env.DB_PASSWORD ?? "postgres",
      max: 10,
    }),
  }),
}).withSchema("app");

/**
 * AsyncLocalStorage holds the per-scope Kysely transaction handle so that
 * `getDb()` returns the same pinned connection for every call inside a
 * `runAs` scope. Do not export the store itself — callers should only
 * interact with it via `getDb()` and `runAs`.
 */
export const txStorage = new AsyncLocalStorage<Transaction<DB>>();

/**
 * Returns the active transaction if we're inside a `runAs` scope, or the
 * pooled `rootDb` otherwise. All services and route handlers should call
 * this instead of importing `rootDb` directly.
 */
export function getDb(): Kysely<DB> | Transaction<DB> {
  return txStorage.getStore() ?? rootDb;
}
