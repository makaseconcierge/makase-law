import { Hono } from "hono";
import { users } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";
import { withUserContext } from "@/middleware/contextMiddleware";

const routes = new Hono<AppEnv>()
  .use(withUserContext)
  .get("/profile", async (c) => {
    const authUser = c.get("authUser");
    const user = await users.getProfile(authUser.user_id);
    return c.json(user);
  })
  .get('/offices', async (c) => {
    const authUser = c.get("authUser");
    const offices = await users.listOffices(authUser.user_id);
    return c.json(offices);
  })

export default routes;
