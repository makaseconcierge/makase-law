import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/honoEnv";

/**
 * Gate a route on a (resource, action) entry in the caller's merged
 * RoleConfig. Runs AFTER `authorizeEmployee` (which populates
 * `c.get("roleConfig")`) and BEFORE any body validator, so a caller
 * without the permission gets a 403 regardless of payload shape — they
 * never find out whether their body was well-formed.
 *
 * On success, the resolved scope (`'self'` or `'team'`) is stashed on
 * `c.var.scope` so the route handler can apply it as a query predicate
 * without re-walking the role_config.
 *
 * Note: `is_admin` does NOT bypass this. Admin is a separate
 * above-team capability for actions that don't fit the resource/scope
 * model (managing the office record, defining roles); use
 * `requireAdmin` for those.
 */
export const requirePermission = (resource: string, action: string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const scope = c.get("roleConfig")[resource]?.[action];
    if (!scope) {
      return c.json({ code: "unauthorized", message: "Unauthorized" }, 403);
    }
    c.set("scope", scope);
    await next();
  });
