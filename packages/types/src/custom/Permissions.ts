export type ActionScopes = {
  [action: string]: "self" | "team" | "office";
}

export type Permissions = {
  [resource: string]: ActionScopes;
}
