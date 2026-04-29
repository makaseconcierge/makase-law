import type { RoleConfig } from "@makase-law/types";

export type Permissions = {
  [resource: string]: {
    [action: string]: {
      team_ids: Set<string>;
      self: boolean;
    }
  }
}

export function parsePermissions(allTeamRoles: { team_id: string; role_config: RoleConfig }[]): Permissions {
  const permissions: Permissions = {};
  for (const teamRole of allTeamRoles) {
    const teamId = teamRole.team_id;
    for (const [resource, actions] of Object.entries(teamRole.role_config)) {
      if (!actions) continue;
      for (const [action, scope] of Object.entries(actions)) {
        permissions[resource] ||= {};
        permissions[resource][action] ||= {
          team_ids: new Set<string>(),
          self: false,
        };
        if (scope === "team") {
          permissions[resource][action].team_ids.add(teamId);
        } else if (scope === "self") {
          permissions[resource][action].self = true;
        }
      }
    }
  }
  return permissions;
}