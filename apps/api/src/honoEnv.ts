import type { Employee, Office, RoleConfig, RoleScope } from "@makase-law/types";

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
    /**
     * Merged role_config across all of the user's `team_member_roles`
     * for this office. Resource → action → 'self' | 'team'. Absent
     * actions = deny. See `@makase-law/types#RoleConfig`.
     */
    roleConfig: RoleConfig;
    /**
     * Team ids the user is a member of in this office. Used by route
     * handlers to apply 'team'-scoped queries as
     * `WHERE team_id = ANY(teamIds)`.
     */
    teamIds: string[];
    /**
     * Populated by `requirePermission` after a successful check so the
     * route handler can branch on whether the caller is acting at
     * 'team' or 'self' breadth without re-reading roleConfig.
     */
    scope?: RoleScope;
  };
};
