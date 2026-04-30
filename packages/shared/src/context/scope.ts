import { getEmployeeContext } from "./logged-in-context";

export type Scope = "office" | "team" | "self";

export function getScopeNoThrow(resource: string, action: string): Scope | false {
  const { isAdmin, isSystem, permissions } = getEmployeeContext();
  if (isAdmin || isSystem) return "office";
  return permissions[resource]?.[action] || false;
}

/**
 * Resolves the caller's scope for `(resource, action)` from the merged
 * permissions map populated by `runAsEmployee`. Admins and system context
 * short-circuit to `'office'`. Throws a 403-shaped error when the caller
 * has no grant — that's "unauthorized user", not "server bug".
 *
 * Every service method that touches data should call this once at the
 * top, before any DB query. Callers without a grant fail loudly here
 * instead of silently returning empty results.
 */
export function getScope(resource: string, action: string): Scope {
  const scope = getScopeNoThrow(resource, action);
  if (!scope) {
    throw { status: 403, message: "Unauthorized" };
  }
  return scope;
}
