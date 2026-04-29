import { Hono } from "hono";
import { loggedInUserService } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";

const routes = new Hono<AppEnv>()
  .get("/profile", async (c) => {
    const user = await loggedInUserService.getProfile();
    return c.json(user);
  })
  .get('/offices', async (c) => {
    const offices = await loggedInUserService.listOffices();
    return c.json(offices);
  })

export default routes;
