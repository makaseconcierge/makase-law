import { configure, getConsoleSink, getJsonLinesFormatter, getAnsiColorFormatter } from "@logtape/logtape";

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
      category: "api",
      lowestLevel: Bun.env.LOG_LEVEL as any || "info",
      sinks: ["console"],
    },
  ],
});
