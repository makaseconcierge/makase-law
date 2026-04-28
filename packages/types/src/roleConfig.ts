/**
 * Per-resource action capability map stored on `app.team_roles.role_config`
 * (and unioned across all of a user's `team_member_roles` to form the
 * effective permissions for a request).
 *
 * Shape: `{ <resource>: { <action>: 'self' | 'team' } }`. Absence of an
 * action key = deny. Scope semantics:
 *   - 'team' → user can act on rows in any team they belong to in this
 *     office (plus any matter granted via `matter_access`).
 *   - 'self' → user can only act on rows where they are the designated
 *     "self" actor for the resource (e.g. `responsible_attorney` for
 *     matters, `assigned_to` for tasks). The self-predicate is defined
 *     per-resource by the application.
 *
 * Action vocabulary is intentionally loose — it grows alongside the API.
 * See the migration comment on `app.team_roles.role_config` for the
 * tentative starting point.
 */
export type RoleScope = "self" | "team";

export type RoleConfig = Record<string, Record<string, RoleScope>>;

/**
 * Merge multiple role_configs into one. Used to collapse a user's
 * `team_member_roles` for an office into a single map per (office, user)
 * for the duration of a request.
 *
 * Merge rule: 'team' beats 'self' (broader scope wins); absence stays
 * absence (= deny).
 */
export function mergeRoleConfigs(configs: RoleConfig[]): RoleConfig {
  const result: RoleConfig = {};
  for (const config of configs) {
    for (const [resource, actions] of Object.entries(config)) {
      const merged = (result[resource] ??= {});
      for (const [action, scope] of Object.entries(actions)) {
        if (merged[action] !== "team") merged[action] = scope;
      }
    }
  }
  return result;
}
