import type { Employee, Office, Permissions } from "@makase-law/types";

export type AppEnv = {
  Variables: {
    authUser: {
      user_id: string;
      email?: string;
      phone?: string;
      user_metadata?: any;
    };
    user_id: string;
    office_id: string;
    office: Office;
    employee: Employee;
    permissions: Permissions;
    teamIds: string[];
  };
};
