import { Hono } from "hono";
import type { AppEnv } from "@/honoEnv";
import { authorizeEmployee } from "@/middleware/authorizeEmployee";
import officeInfoRoutes from "./officeInfoRoutes";
import matterRoutes from "./matterRoutes";
import { withEmployeeContext } from "@/middleware/contextMiddleware";

const routes = new Hono<AppEnv>()
  .use(withEmployeeContext)
  .use(authorizeEmployee)
  .route("/info", officeInfoRoutes)
  .route("/matters", matterRoutes);

export default routes;
