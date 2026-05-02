import { z } from "zod";
import type { MatterPatch, NewMatter } from "@makase-law/types";
import { JsonObjectSchema } from "./json.schema";

const MATTER_STAGES = [
  "consultation",
  "setup",
  "active",
  "closed",
  "archived",
] as const;

const BILLING_TYPES = [
  "active",
  "active_deferred",
  "contingency",
  "flat_fee",
  "flat_fee_plus_hourly",
] as const;

/**
 * Shared column shapes so create/patch stay aligned. When zod finally
 * ships a first-class "partial the required fields" helper we can drop
 * this; for now the duplication is explicit and shallow.
 */
const matterFieldsSchema = z.object({
  description: z.string().optional(),
  stage: z.enum(MATTER_STAGES).optional(),
  type: z.string().optional(),
  billing_type: z.enum(BILLING_TYPES).optional(),
  billing_settings: JsonObjectSchema.optional(),
  started_representation_at: z.coerce.date().nullable().optional(),
  ended_representation_at: z.coerce.date().nullable().optional(),
  referral_source: z.string().nullable().optional(),
  referral_id: z.string().nullable().optional(),
  referral_data: JsonObjectSchema.optional(),
  preferred_office_location: z.string().optional(),
  data: JsonObjectSchema.optional(),
});

/**
 * Runtime validator for POST payloads that create a new matter.
 * `office_id` is omitted — it comes from the route param. `team_id` and
 * `responsible_attorney_id` are required because the matter row constrains
 * to a single team and a single responsible attorney from row creation.
 * `supervising_attorney_id` is optional — the DB column is nullable.
 */
export const NewMatterSchema = matterFieldsSchema
  .extend({
    title: z.string().min(1).max(300),
    team_id: z.uuid(),
    responsible_attorney_id: z.uuid(),
    supervising_attorney_id: z.uuid().nullable().optional(),
    billing_type: z.enum(BILLING_TYPES),
  })
  .strict() satisfies z.ZodType<NewMatter>;

/**
 * Runtime validator for PATCH payloads to an existing matter. Callers
 * who want to archive should use the dedicated (future)
 * `matters.archive()` service method; `is_archived` is intentionally
 * not patchable here. Reassigning a matter to a different team is
 * intentionally not supported via PATCH — too many invariants (tasks,
 * invoices, expenses re-key on team_id) — and would be a dedicated
 * service method.
 */
export const MatterPatchSchema = matterFieldsSchema
  .extend({
    title: z.string().min(1).max(300).optional(),
    description: z.string().optional(),
  })
  .strict() satisfies z.ZodType<MatterPatch>;
