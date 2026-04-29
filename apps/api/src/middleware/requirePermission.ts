import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/honoEnv";
import { getEmployeeContext } from "@makase-law/shared";


export const requirePermission = (resource: string, action: string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const permissions = c.get("permissions");
    const employeeContext = getEmployeeContext();

    const permittedTeamIds = Array.from(permissions[resource]?.[action]?.team_ids || []);

    const hasPermission = permittedTeamIds.length > 0 || permissions[resource]?.[action]?.self;
    if (!hasPermission || !employeeContext) {
      return c.json({ code: "unauthorized", message: "Unauthorized" }, 403);
    }

    employeeContext.permittedTeamIds = permittedTeamIds;
    await next();
  });
