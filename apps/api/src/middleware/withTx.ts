import { createMiddleware } from "hono/factory";
import { runAs } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";

/**
 * Wraps mutating requests in a transaction attributed to the authenticated
 * user. The DB trigger `app.set_audit_fields` reads the per-transaction
 * `app.acting_user_id` GUC set by `runAs` to fill in created_by/updated_by.
 *
 * GET requests skip this wrapping: they issue no writes, so attribution
 * is unnecessary and the `BEGIN`/`COMMIT` per read isn't worth paying.
 * If a GET ever needs a consistent snapshot across multiple reads, wrap
 * the handler body explicitly in `runAs(...)`.
 */
export const withTx = createMiddleware<AppEnv>(async (c, next) => {
  if (c.req.method === "GET") return next();
  await runAs(c.get("user_id"), () => next());
});
