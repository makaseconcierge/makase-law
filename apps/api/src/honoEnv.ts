import type { Employee } from "@makase-law/types";

export type AppEnv = {
  Variables: {
    user_id: string;
    employee: Employee;
  };
};
