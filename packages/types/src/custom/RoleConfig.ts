export type ResourceActions = {
  [action: string]: "self" | "team";
}

export type RoleConfig = {
  [resource: string]: ResourceActions;
}
