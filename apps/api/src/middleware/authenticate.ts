import type { AppEnv } from "@/honoEnv";
import { createMiddleware } from "hono/factory";
import { jwtVerify } from "jose";

export const authenticate = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "unauthenticated" }, 401);
  }

  const token = header.slice(7);
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET));
    if (typeof payload.sub !== "string") {
      return c.json({ error: "unauthenticated", message: "Please Login Again" }, 401);
    }

    c.set("authUser", {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      phone: typeof payload.phone === "string" ? payload.phone : undefined,
      user_metadata: payload.user_metadata,
    });
    c.set("user_id", payload.sub);
  } catch (e) {
    return c.json({ error: "unauthenticated", message: "Please Login Again" }, 401);
  }
  await next();
});
