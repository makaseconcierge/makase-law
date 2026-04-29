import { Hono } from "hono";
import { matters } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";
import { requirePermission } from "@/middleware/requirePermission";

export const matterRoutes = new Hono<AppEnv>()
  .get("/", requirePermission("matter", "read"), async (c) => {
    return c.json(await matters.list());
  })
  .get("/:matterId", requirePermission("matter", "read"), async (c) => {
    const matterId = c.req.param("matterId");
    return c.json(await matters.get(matterId));
  });

export default matterRoutes;
