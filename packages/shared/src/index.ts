export { _rootDb } from "./db/_rootDb";
export { authenticatedContext, getEmployeeContext } from "./context/loggedInContext";
export {
  runAsEmployee,
  runAsUser,
  SYSTEM_USER_ID,
} from "./context/runAs";
export * as matters from "./services/office-scoped/matters.service";
export * as office from "./services/office-scoped/office.service";
export * as loggedInUserService from "./services/user-scoped/logged-in-user.service";

export * as schemas from "./schemas";
