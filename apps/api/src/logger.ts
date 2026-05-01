import { configure, getConsoleSink, getJsonLinesFormatter, getAnsiColorFormatter, getLogger, withCategoryPrefix } from "@logtape/logtape";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "./honoEnv";
import { AsyncLocalStorage } from "node:async_hooks";

await configure({
  sinks: {
    console: getConsoleSink({
      formatter: Bun.env.NODE_ENV === "development" 
      ?  getAnsiColorFormatter()
      : getJsonLinesFormatter(),
    }),
  },
  loggers: [
    {
      category: [],
      lowestLevel: Bun.env.LOG_LEVEL as any || "info",
      sinks: ["console"],
    },
  ],
  contextLocalStorage: new AsyncLocalStorage()
});


export const loggerMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  await withCategoryPrefix("api", async() => {
    await next();
  });
});
