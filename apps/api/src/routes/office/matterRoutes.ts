import { Hono } from "hono";
import { matters } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";
import { requirePermission } from "@/middleware/requirePermission";

export const matterRoutes = new Hono<AppEnv>()
  .get("/", requirePermission("matter", "read"), async (c) => {
    const office_id = c.get("office_id");
    return c.json(await matters.list({office_id, user_id: c.get("user_id"), allowedTeamIds: c.get("permittedTeamIds")}));
  })
  .get("/:matterId", requirePermission("matter", "read"), async (c) => {
    const matterId = c.req.param("matterId");
    const office_id = c.get("office_id");
    return c.json(await matters.get({office_id, user_id: c.get("user_id"), allowedTeamIds: c.get("permittedTeamIds")}, matterId));
  });

export default matterRoutes;
