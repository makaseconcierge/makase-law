import { Hono } from "hono";
import type { AppEnv } from "@/honoEnv";
import { authorizeEmployee } from "@/middleware/authorizeEmployee";
import officeInfoRoutes from "./officeInfoRoutes";
import matterRoutes from "./matterRoutes";
import myRoutes from "./myRoutes";

const routes = new Hono<AppEnv>()
  .use(authorizeEmployee)
  .route("/my", myRoutes)
  .route("/info", officeInfoRoutes)
  .route("/matters", matterRoutes);

export type OfficeApi = typeof routes;

export default routes;
