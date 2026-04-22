import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "@/honoEnv";

/**
 * Gate a route on a permission string. Runs AFTER `authorizeEmployee`
 * (which populates `c.get("permissions")`) and BEFORE any body validator,
 * so a caller without the permission gets a 403 regardless of payload
 * shape — they never find out whether their body was well-formed.
 */
export const requirePermission =
  (permission: string): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    if (!c.get("permissions").includes(permission)) {
      return c.json({ code: "unauthorized", message: "Unauthorized" }, 403);
    }
    await next();
  };
