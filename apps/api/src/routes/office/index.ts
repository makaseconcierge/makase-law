import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { employees, offices } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";
import officeInfoRoutes from "./officeInfoRoutes";
import matterRoutes from "./matterRoutes";
import {  } from "@logtape/logtape";


const authorizeEmployee: MiddlewareHandler<AppEnv> = async (c, next) => {
  const office_id = c.req.param("office_id");
  const authUser = c.get("authUser");
  if (!authUser || !office_id) {
    return c.json({ code: "unauthenticated", message: "You are not logged in" }, 401);
  }

  const [employee, office] = await Promise.all([
    employees.get(office_id, authUser.id),
    offices.get(office_id),
  ]);
  if (!employee || !office) {
    return c.json({ code: "unauthorized", message: "You do not have access to this office" }, 403);
  }

  const permissions: string[] = [];
  employee.functional_roles.forEach((role) => {
    let rolePermissions = office.role_config[role] as string[];
    permissions.push(...rolePermissions);
  });

  c.set("office_id", office.office_id);
  c.set("office", office);
  c.set("employee", employee);
  c.set("permissions", permissions);
  c.set("permissionsString", permissions.join(","));

  await next();
};

const routes = new Hono<AppEnv>()
  .use(authorizeEmployee)
  .route("/info", officeInfoRoutes)
  .route("/matters", matterRoutes)
  // .route("/settings", settingRoutes)
  // .route("/invoices", invoiceRoutes)


export default routes;
