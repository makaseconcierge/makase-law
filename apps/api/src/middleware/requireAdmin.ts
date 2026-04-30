import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/honoEnv";

/**
 * Gate a route on `_employees.is_admin`. Reserved for actions that
 * don't fit the capability/scope model — defining roles, managing
 * teams, editing the office record. Capability-gated CRUD relies on
 * services calling `getCapabilityScope(capability, action)` directly.
 */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("employee").is_admin) {
    return c.json({ code: "unauthorized", message: "Admin access required" }, 403);
  }
  await next();
});
