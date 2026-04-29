import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/honoEnv";


export const requirePermission = (resource: string, action: string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const permissions = c.get("permissions");

    const permittedTeamIds = Array.from(permissions[resource]?.[action]?.team_ids || []);

    const hasPermission = permittedTeamIds.length > 0 || permissions[resource]?.[action]?.self;
    if (!hasPermission) {
      return c.json({ code: "unauthorized", message: "Unauthorized" }, 403);
    }

    c.set("permittedTeamIds", permittedTeamIds);
    await next();
  });
