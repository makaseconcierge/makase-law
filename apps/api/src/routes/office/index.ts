import { Hono } from "hono";
import type { AppEnv } from "@/honoEnv";
import { authorizeEmployee } from "@/middleware/authorizeEmployee";
import officeInfoRoutes from "./officeInfoRoutes";
import matterRoutes from "./matterRoutes";

const routes = new Hono<AppEnv>()
  .use(authorizeEmployee)
  .route("/info", officeInfoRoutes)
  .route("/matters", matterRoutes);

export default routes;
