import "./src/logger";
import { Hono } from "hono";
import { cors } from "hono/cors";
import officeRoutes from "./src/routes/office";
import { authenticate } from "./src/middleware/authenticate";
import { withTx } from "./src/middleware/withTx";
import userRoutes from "./src/routes/user";
import type { AppEnv } from "./src/honoEnv";

const app = new Hono<AppEnv>();

app.onError((err, c) => {
  console.error("[api] Unhandled error:", err);
  return c.json(
    { error: err instanceof Error ? err.message : "internal_error" },
    500,
  );
});

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(authenticate);
app.use(withTx);
app.route("/office/:office_id", officeRoutes);
app.route("/my", userRoutes);

export default {
  port: 8000,
  fetch: app.fetch,
};
