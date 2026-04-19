import { Hono } from "hono";
import { offices } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";


const officeInfoRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const office_id = c.get("office_id");
    const office = await offices.get(office_id);
    return c.json(office);
  })
  .patch("/", async (c) => {
    if (!c.get("permissionsString").includes('office_info:edit')) {
      return c.json({ code: "unauthorized", message: "Unauthorized" }, 403);
    }
    const office_id = c.get("office_id");
    const data = await c.req.json();
    const office = await offices.update(office_id, data);
    return c.json(office);
  })

export default officeInfoRoutes;
