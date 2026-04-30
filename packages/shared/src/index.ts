export { _rootDb } from "./db/_rootDb";
export { authenticatedContext, getEmployeeContext } from "./context/loggedInContext";
export type { EmployeeContext, UserContext } from "./context/loggedInContext";
export { getCapabilityScope } from "./context/capabilities";
export type { Scope } from "./context/capabilities";
export {
  runAsEmployee,
  runAsUser,
  runAsSystem,
  SYSTEM_USER_ID,
} from "./context/runAs";
export * as matters from "./services/office-scoped/matters.service";
export * as office from "./services/office-scoped/office.service";
export * as loggedInUserService from "./services/user-scoped/logged-in-user.service";

export * as schemas from "./schemas";
