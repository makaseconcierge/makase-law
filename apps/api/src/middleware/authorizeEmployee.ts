import { createMiddleware } from "hono/factory";
import { loggedInUserService, runAsEmployee } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";

/**
 * Resolves the request actor's employment in the URL-scoped office,
 * loads the merged permissions map and team memberships in parallel,
 * and opens the employee-attributed transaction. Mounted under
 * `/office/:office_id` so every downstream office route runs inside
 * `runAsEmployee` with `c.get("employee")` populated. Services read
 * permissions/teams from the AsyncLocalStorage employee context via
 * `getCapabilityScope` / `getEmployeeContext`.
 *
 * 401 if the request hasn't been authenticated yet (defense-in-depth —
 * `authenticateUser` is applied globally in `main.ts`); 403 if the
 * caller isn't an active employee of this office.
 */
export const authorizeEmployee = createMiddleware<AppEnv>(async (c, next) => {
  const office_id = c.req.param("office_id");
  const user_id = c.get("user_id");
  if (!user_id || !office_id) {
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
  await runAsEmployee(employee, permissions, teamIds, () => next());
});
