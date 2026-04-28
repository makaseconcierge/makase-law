import { z } from "zod";
import type { OfficePatch } from "@makase-law/types";
import { JsonObjectSchema } from "./jsonSchema";

/**
 * Runtime validator for PATCH payloads to `app.offices`. Pairs with the
 * TS `OfficePatch` type via `satisfies z.ZodType<OfficePatch>` — if a
 * column is added/removed/retyped in the DB, `kysely-codegen` regenerates
 * `DB`, which propagates through `OfficePatch`, which makes this zod
 * schema fail to `satisfies`. That's the drift guard.
 *
 * Extend here (not at callsites) with runtime-only rules the DB can't
 * express: email format, URL shape, phone normalization, etc.
 */
export const OfficePatchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    address: JsonObjectSchema.optional(),
    phone: z.string().nullable().optional(),
    email: z.email().nullable().optional(),
    website: z.url().nullable().optional(),
    logo: z.string().nullable().optional(),
  })
  .strict() satisfies z.ZodType<OfficePatch>;
