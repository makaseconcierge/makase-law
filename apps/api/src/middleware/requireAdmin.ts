import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/honoEnv";

/**
 * Gate a route on `_employees.is_admin`. Reserved for actions that
 * don't fit the resource/scope RoleConfig model — managing the office
 * record itself, defining team_roles, etc. Resource-level CRUD should
 * use `requirePermission(resource, action)` instead.
 */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("employee").is_admin) {
    return c.json({ code: "unauthorized", message: "Admin access required" }, 403);
  }
  await next();
});
