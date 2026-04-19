import type { Employee, Office } from "@makase-law/types";

export type AppEnv = {
  Variables: {
    authUser: {
      id: string;
      email?: string;
      phone?: string;
      user_metadata?: any;
    };
    office_id: string;
    office: Office;
    user_id: string;
    employee: Employee;
    permissions: string[];
    permissionsString: string;
  };
};
