import { Hono } from "hono";
import { matters } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";


export const matterRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const office_id = c.get("office_id");
    return c.json(await matters.list(office_id));
  })
  .get("/:matterId", async (c) => {
    const matterId = c.req.param("matterId");
    const office_id = c.get("office_id");
    return c.json(await matters.get(office_id, matterId));
  })

export default matterRoutes;
