import { z } from "zod";
import type { JsonValue, JsonObject, JsonArray } from "@makase-law/types";

/**
 * Zod mirror of Kysely's codegen `JsonValue` type so zod-validated
 * payloads can be passed straight into `.values()` / `.set()` on JSONB
 * columns without structural-typing complaints.
 */
export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

export const JsonObjectSchema: z.ZodType<JsonObject> = z.lazy(() =>
  z.record(z.string(), JsonValueSchema),
);

export const JsonArraySchema: z.ZodType<JsonArray> = z.lazy(() =>
  z.array(JsonValueSchema),
);
