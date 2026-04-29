import { SQL } from "bun";
import { Kysely, type Transaction } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import type { DB } from "@makase-law/types";
import { getEmployeeContext } from "../context/loggedInContext";

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
 * Returns the active transaction if we're inside a `runAs` scope, or the
 * pooled `rootDb` otherwise. All services and route handlers should call
 * this instead of importing `rootDb` directly.
 */
export function getDb(): Kysely<DB> | Transaction<DB> {
  const context = getEmployeeContext();
  return context.db;
}
