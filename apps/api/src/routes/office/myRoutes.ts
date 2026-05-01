import { Hono } from "hono";
import type { AppEnv } from "@/honoEnv";
import { getEmployeeContext, loggedInUserService, teams } from "@makase-law/shared";

const myRoutes = new Hono<AppEnv>()
  .get("/employment", async (c) => {
    const employee = await loggedInUserService.getEmploymentAtOffice(c.get("employee").office_id);
    return c.json(employee);
  })
  .get("/teams", async (c) => {
    const myTeams = await teams.listMine();
    return c.json(myTeams);
  })
  .get("/roles", async (c) => {
    const { loggedInOfficeId } = getEmployeeContext();
    const myRoles = await loggedInUserService.getRolesAtOffice(loggedInOfficeId);
    return c.json(myRoles);
  });

export default myRoutes;