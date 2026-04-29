import { createMiddleware } from "hono/factory";
import { employees } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["authorizeEmployeeMiddleware"]);


function doublCheckOfficeIds(data: any, office_id: string) {
  if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
          if (!doublCheckOfficeIds(data[i], office_id)) return false;
      }
  } else if (!!data && typeof data === 'object') {
      if (data.office_id !== undefined && data.office_id !== office_id) {
          return false;
      }
      for (const key in data) {
        if (key && Object.hasOwn(data, key)) {
          if (!doublCheckOfficeIds(data[key], office_id)) return false;
        }
      }
  }
  return true;
}


/**
 * Resolves the request actor's employment in the URL-scoped office,
 * loads the office, and computes the merged RoleConfig + team_ids for
 * the (office, user) pair. Mounted under `/office/:office_id` so every
 * downstream office route can rely on `c.get("office")`,
 * `c.get("employee")`, `c.get("roleConfig")`, and `c.get("teamIds")`.
 *
 * 401 if the request hasn't been authenticated yet (defense-in-depth —
 * `authenticate` is applied globally in `main.ts`); 403 if the caller
 * isn't an active employee of this office.
 */
export const authorizeEmployee = createMiddleware<AppEnv>(async (c, next) => {
  const office_id = c.req.param("office_id");
  const authUser = c.get("authUser");
  if (!authUser || !office_id) {
    return c.json(
      { code: "unauthenticated", message: "You are not logged in" },
      401,
    );
  }

  const [employee, permissions] = await Promise.all([
    employees.get(office_id, authUser.user_id),
    employees.getPermissions(office_id, authUser.user_id),
  ]);
  if (!employee) {
    return c.json(
      { code: "unauthorized", message: "You do not have access to this office" },
      403,
    );
  }

  c.set("employee", employee);
  c.set("permissions", permissions);

  await next();

  const clonedResp = c.res.clone().json();
  const allValidOffices = doublCheckOfficeIds(clonedResp, employee.office_id);
  if (!allValidOffices) {
    logger.error("Invalid offices found in response", { response: clonedResp });
    return c.json(
      { code: "unauthorized", message: "You do not have access to this office" },
      403,
    );
  }
});
