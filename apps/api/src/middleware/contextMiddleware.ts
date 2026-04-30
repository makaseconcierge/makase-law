import { createMiddleware } from "hono/factory";
import { runAsEmployee, runAsUser } from "@makase-law/shared";
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
export const withEmployeeContext = createMiddleware<AppEnv>(async (c, next) => {
  await runAsEmployee(c.get("employee"), () => next());
});

export const withUserContext = createMiddleware<AppEnv>(async (c, next) => {
  await runAsUser(c.get("authUser").user_id, () => next());
});
