import { SQL } from "bun";
import { Kysely } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import type { DB } from "@makase-law/types";

/**
 * Root pool-backed Kysely client. Used directly only by `runAs` to open
 * per-scope transactions, and by read-only GET handlers that have no
 * AsyncLocalStorage context. Do not import this directly from services —
 * use `getDb()` so the correct per-request transaction is picked up.
 */
export const _rootDb = new Kysely<DB>({
  dialect: new PostgresJSDialect({
    postgres: new SQL({
      url: process.env.DATABASE_URL,
      max: 10,
    }),
  }),
}).withSchema("app");
