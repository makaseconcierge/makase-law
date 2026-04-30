import { createMiddleware } from "hono/factory";
import { loggedInUserService } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";

/**
 * Resolves the request actor's employment in the URL-scoped office,
 * loads the office, and computes the merged RoleConfig + team_ids for
 * the (office, user) pair. Mounted under `/office/:office_id` so every
 * downstream office route can rely on `c.get("employee")`, `c.get("permissions")`.
 *
 * 401 if the request hasn't been authenticated yet (defense-in-depth —
 * `authenticate` is applied globally in `main.ts`); 403 if the caller
 * isn't an active employee of this office.
 */
export const authorizeEmployee = createMiddleware<AppEnv>(async (c, next) => {
  const office_id = c.req.param("office_id");
  const authUser = c.get("authUser");
  if (!authUser?.user_id || !office_id) {
    return c.json(
      { code: "unauthenticated", message: "You are not logged in" },
      401,
    );
  }

  const [employee, permissions, teamIds] = await Promise.all([
    loggedInUserService.getEmploymentAtOffice(office_id),
    loggedInUserService.getPermissionsAtOffice(office_id),
    loggedInUserService.getTeamIdsAtOffice(office_id),
  ]);
  if (!employee) {
    return c.json(
      { code: "unauthorized", message: "You do not have access to this office" },
      403,
    );
  }

  c.set("employee", employee);
  c.set("permissions", permissions);
  c.set("teamIds", teamIds);

  await next();
});
