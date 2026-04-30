import { Hono } from "hono";
import { matters } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";

export const matterRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    return c.json(await matters.list());
  })
  .get("/:matterId", async (c) => {
    const matterId = c.req.param("matterId");
    return c.json(await matters.get(matterId));
  });

export default matterRoutes;
