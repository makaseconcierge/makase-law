import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { offices, schemas } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";
import { requireAdmin } from "@/middleware/requireAdmin";

const officeInfoRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const office_id = c.get("office_id");
    const office = await offices.get(office_id);
    return c.json(office);
  })
  .patch(
    "/",
    requireAdmin,
    zValidator("json", schemas.OfficePatchSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            code: "invalid_request",
            message: "Invalid request body",
            errors: result.error.issues,
          },
          400,
        );
      }
    }),
    async (c) => {
      const office_id = c.get("office_id");
      const data = c.req.valid("json");
      const office = await offices.update(office_id, data);
      return c.json(office);
    },
  );

export default officeInfoRoutes;
