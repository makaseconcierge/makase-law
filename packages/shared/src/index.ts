export { _rootDb } from "./db/_rootDb";
export { authenticatedContext, getEmployeeContext } from "./context/loggedInContext";
export {
  runAsEmployee,
  runAsUser,
  SYSTEM_USER_ID,
} from "./context/runAs";
export * as matters from "./services/office-scoped/matterService";
export * as offices from "./services/office-scoped/officeService";
export * as loggedInUserService from "./services/user-scoped/logged-in-user.service";

export * as schemas from "./schemas";
