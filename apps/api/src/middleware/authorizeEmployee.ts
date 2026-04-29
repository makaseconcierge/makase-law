import { createMiddleware } from "hono/factory";
import { employees, offices } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";

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

  const [employee, office, permissions] = await Promise.all([
    employees.get(office_id, authUser.id),
    offices.get(office_id),
    employees.getPermissions(office_id, authUser.id),
  ]);
  if (!employee || !office) {
    return c.json(
      { code: "unauthorized", message: "You do not have access to this office" },
      403,
    );
  }

  c.set("office_id", office.office_id);
  c.set("office", office);
  c.set("employee", employee);
  c.set("permissions", permissions);

  await next();
});
