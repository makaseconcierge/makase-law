import type { AppEnv } from "@/honoEnv";
import { createMiddleware } from "hono/factory";
import { jwtVerify } from "jose";
import { runAsUser } from "@makase-law/shared";

/**
 * Verifies the Supabase JWT, sets `user_id` on the request, and opens
 * the per-request transaction attributed to the authenticated user.
 * `runAsUser` sets `app.acting_user_id` so the audit trigger fills in
 * created_by/updated_by on any writes; reads still benefit from the
 * pinned connection. Applied globally in `main.ts` — any public route
 * (e.g. healthcheck) must be registered before this middleware.
 */
export const authenticateUser = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "unauthenticated" }, 401);
  }

  const token = header.slice(7);
  let user_id: string;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET));
    if (typeof payload.sub !== "string") {
      return c.json({ error: "unauthenticated", message: "Please Login Again" }, 401);
    }
    user_id = payload.sub;
    c.set("user_id", user_id);
  } catch (e) {
    return c.json({ error: "unauthenticated", message: "Please Login Again" }, 401);
  }
  await runAsUser(user_id, () => next());
});
