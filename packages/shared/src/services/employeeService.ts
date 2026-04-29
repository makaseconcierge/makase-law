import type { RoleConfig } from "@makase-law/types";
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


// TODO: refactor this into utils package
export type Permissions = {
  [resource: string]: {
    [action: string]: {
      team_ids: Set<string>;
      self: boolean;
    }
  }
}

function parsePermissions(allTeamRoles: { team_id: string; role_config: RoleConfig }[]): Permissions {
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

export async function getPermissions(
  office_id: string,
  user_id: string,
): Promise<Permissions> {
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

  return parsePermissions(rows);
}
