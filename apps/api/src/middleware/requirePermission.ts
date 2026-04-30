import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/honoEnv";
import { getEmployeeContext } from "@makase-law/shared";


export const requirePermission = (resource: string, action: string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const permissions = c.get("permissions");
    const employeeContext = getEmployeeContext();

    const fullAccessTeamIds = Array.from(permissions[resource]?.[action]?.fullAccessTeamIds || []);
    const selfAccessTeamIds = Array.from(permissions[resource]?.[action]?.selfAccessTeamIds || []);

    const hasPermission = fullAccessTeamIds.length > 0 || selfAccessTeamIds.length > 0;
    if (!hasPermission || !employeeContext) {
      return c.json({ code: "unauthorized", message: "Unauthorized" }, 403);
    }

    employeeContext.fullAccessTeamIds = fullAccessTeamIds;
    employeeContext.selfAccessTeamIds = selfAccessTeamIds;
    await next();
  });
