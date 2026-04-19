// kysely.config.ts
import { defineConfig } from 'kysely-codegen';

export default defineConfig({
  dialect: "postgres",
  defaultSchemas: ["app"],
  outFile: "./src/dbTypes.ts",
  // Import your specific TypeScript interfaces
  customImports: {
    OfficeRoleConfig: "./officeRoleConfig.ts",
  },
  // Apply them only to specific table columns
  overrides: {
    columns: {
      "offices.role_config": "OfficeRoleConfig",
    }
  }
});