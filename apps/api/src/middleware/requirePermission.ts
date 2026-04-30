import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/honoEnv";
import { getEmployeeContext } from "@makase-law/shared";


export const requirePermission = (resource: string, action: string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const { is_admin } = c.get("employee");
    const permissions = c.get("permissions");
    const teamIds = c.get("teamIds");
    const employeeContext = getEmployeeContext();
    const scope = is_admin ? "office" : permissions[resource]?.[action];
    
    if (!scope) {
      return c.json({ code: "unauthorized", message: "Unauthorized" }, 403);
    }

    employeeContext.scope = scope;
    employeeContext.permitTeamIds = teamIds;
    await next();
  });
