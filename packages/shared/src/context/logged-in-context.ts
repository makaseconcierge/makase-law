import { AsyncLocalStorage } from "node:async_hooks";
import { Transaction } from "kysely";
import type { DB, Permissions } from "@makase-law/types";
import { getLogger } from "@logtape/logtape";

let logger = getLogger(["authenticatedContext"]);

export type EmployeeContext = {
  db: Transaction<DB>,
  loggedInUserId: string,
  loggedInOfficeId: string,
  isAdmin: boolean,
  isSystem: boolean,
  permissions: Permissions,
  teamIds: string[],
  blockMatterIds: string[],
  addMatterIds: string[],
};

export type UserContext = {
  db: Transaction<DB>,
  loggedInUserId: string,
} & Partial<EmployeeContext>;

export const authenticatedContext = new AsyncLocalStorage<EmployeeContext | UserContext>();

export function hasUserContext(): boolean {
  const context = authenticatedContext.getStore();
  return !!context && !!context.loggedInUserId && !!context.db;
}

export function hasEmployeeContext(): boolean {
  const context = authenticatedContext.getStore();
  return !!context && !!context.loggedInOfficeId && !!context.loggedInUserId && !!context.db;
}

export function getEmployeeContext(): EmployeeContext {
  const context = authenticatedContext.getStore();
  if (!context || !context.db || !context.loggedInOfficeId || !context.loggedInUserId || !context.permissions || !context.teamIds) {
    const log_id = crypto.randomUUID();
    logger.error("Need to define user / office using runAs to access database", { log_id, stack: new Error().stack });
    throw { status: 500, message: "Please contact support@makase.com with the following log ID: " + log_id };
  }
  return context as EmployeeContext;
}

export function getUserContext(): UserContext {
  const context = authenticatedContext.getStore();
  if (!context || !context.db || !context.loggedInUserId) {
    const log_id = crypto.randomUUID();
    logger.error("Need to define user using runAs to access database", { log_id, stack: new Error().stack });
    throw { status: 500, message: "Please contact support@makase.com with the following log ID: " + log_id };
  }
  return context;
}
