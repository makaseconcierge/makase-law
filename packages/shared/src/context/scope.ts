import { getEmployeeContext } from "./logged-in-context";
import type { ExpressionBuilder } from "kysely";
import type { ReferenceExpression } from "kysely";
import type { OperandValueExpressionOrList } from "kysely";
import type { DB } from "@makase-law/types";

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


type TeamSelfTables = "matters" | "employee_teams" | "tasks" | "time_entries" | "invoices" | "expenses" | "teams" | "employee_teams";
export const buildScopeFilter = <T extends TeamSelfTables> (
  resource: string,
  action: string,
  assignmentColumns: readonly ReferenceExpression<DB, T>[]
) => {
  const scope = getScope(resource, action);
  return (eb: ExpressionBuilder<DB, T>) => {
    const { loggedInOfficeId, loggedInUserId, teamIds } = getEmployeeContext();
    const isLoggedInOffice = eb("office_id", "=", loggedInOfficeId as OperandValueExpressionOrList<DB, T, "office_id">);
    if (scope === "office") return isLoggedInOffice;

    // self or team both allow access to the logged in user's own records so default access options include that. Then add or team access if allowed.
    const access_options = assignmentColumns.map(columnName => eb(columnName, "=", loggedInUserId));
    if (scope === "team" && teamIds.length) access_options.push(eb("team_id", "in", teamIds as OperandValueExpressionOrList<DB, T, "team_id">));
    return eb.and([
      isLoggedInOffice,
      eb.or(access_options)
    ]);
  };
}
