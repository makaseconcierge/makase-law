import type { Role, Permissions } from "@makase-law/types";



export function mergeRolePermissions(roles: Pick<Role, "permissions">[]): Permissions {
  const permissions: Permissions = {};
  for (const role of roles) {
    for (const [resource, actions] of Object.entries(role.permissions)) {
      if (!actions) continue;
      if (!permissions[resource]) {
        permissions[resource] = {...actions};
      } else {
        for (const [action, scope] of Object.entries(actions)) {
          if (scope === 'office' || permissions[resource][action] === 'office') {
            permissions[resource][action] = 'office';
          } else if (scope === 'team' || permissions[resource][action] === 'team') {
            permissions[resource][action] = 'team';
          } else if (scope === 'self' || permissions[resource][action] === 'self') {
            permissions[resource][action] = 'self';
          }
        }
      }
    }
  }
  return permissions;
}