export { rootDb } from "./db/dbClient";
export { authenticatedContext, getEmployeeContext } from "./context/loggedInContext";
export {
  runAsEmployee,
  runAsUser,
  SYSTEM_USER_ID,
} from "./context/runAs";
export * as matters from "./services/matterService";
export * as offices from "./services/officeService";
export * as employees from "./services/employeeService";
export * as users from "./services/userService";

export * as schemas from "./schemas";

export type { Permissions } from "./services/employeeService";