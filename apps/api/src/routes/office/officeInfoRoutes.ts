import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { office, schemas } from "@makase-law/shared";
import type { AppEnv } from "@/honoEnv";
import { requireAdmin } from "@/middleware/requireAdmin";

const officeInfoRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const officeInfo = await office.get();
    return c.json(officeInfo);
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
      const officePatch = c.req.valid("json");
      const updatedOffice = await office.update(officePatch);
      return c.json(updatedOffice);
    },
  );

export default officeInfoRoutes;
