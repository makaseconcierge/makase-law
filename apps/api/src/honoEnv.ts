import type { Employee, Office } from "@makase-law/types";
import type { Permissions } from "@makase-law/shared";

export type AppEnv = {
  Variables: {
    authUser: {
      id: string;
      email?: string;
      phone?: string;
      user_metadata?: any;
    };
    user_id: string;
    office_id: string;
    office: Office;
    employee: Employee;
    permissions: Permissions;
    permittedTeamIds: string[];
  };
};
