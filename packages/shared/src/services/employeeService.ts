import type { RoleConfig } from "@makase-law/types";
import { mergeRoleConfigs } from "@makase-law/types";
import { getDb } from "../db/dbClient";
import { getLogger } from "@logtape/logtape";

let logger = getLogger(["employeeService"]);

export async function get(office_id: string, user_id: string) {
  logger.trace("Getting employee", { office_id, user_id });
  return getDb()
    .selectFrom("employees")
    .selectAll()
    .where("office_id", "=", office_id)
    .where("user_id", "=", user_id)
    .executeTakeFirst();
}

/**
 * The merged permission map a request should be evaluated against, plus
 * the team_ids the user belongs to in this office (needed to apply
 * 'team' scope as `WHERE team_id IN (...)` at query time).
 *
 * Pulls every `team_member_roles` row for (office_id, user_id), joins to
 * `team_roles.role_config`, and merges them into one RoleConfig with
 * `'team'` beating `'self'`. Returns an empty map if the user has no
 * team memberships in this office — admin checks live elsewhere
 * (`employee.is_admin`) since admin is a non-resource-scoped bypass.
 */
export async function getRoleConfig(
  office_id: string,
  user_id: string,
): Promise<{ roleConfig: RoleConfig; teamIds: string[] }> {
  logger.trace("Resolving role config", { office_id, user_id });
  const rows = await getDb()
    .selectFrom("team_member_roles as tmr")
    .innerJoin("team_roles as tr", (join) =>
      join
        .onRef("tr.team_role_id", "=", "tmr.team_role_id")
        .onRef("tr.office_id", "=", "tmr.office_id"),
    )
    .where("tmr.office_id", "=", office_id)
    .where("tmr.user_id", "=", user_id)
    .select(["tmr.team_id", "tr.role_config"])
    .execute();

  // role_config is JSONB and types as JsonValue. The shape is enforced
  // by application code at every write point, so coercing to RoleConfig
  // at the read boundary is intentional.
  const roleConfig = mergeRoleConfigs(
    rows.map((r) => r.role_config as RoleConfig),
  );
  const teamIds = Array.from(new Set(rows.map((r) => r.team_id)));
  return { roleConfig, teamIds };
}
