import { createContext, useContext } from "react";
import type { Office, Permissions, Role, Team } from "@makase-law/types";
import { useUserProfileWithOffices, type UserProfileWithOffices } from "./user-context";

export function useOffices() {
  const user = useUserProfileWithOffices();
  return user?.offices ?? [];
}

export type PartialRole = Pick<Role, "role_id" | "name" | "permissions">;

type OfficeContextStuff = {
  officeInfo: Office,
  teams: Team[],
  permissions: Permissions,
  roles: PartialRole[],
  isAdmin: boolean,
}
export const OfficeContext = createContext<OfficeContextStuff | null>(null);

export function useOffice() {
  const context = useContext(OfficeContext);
  if (!context) {
    throw new Error("useOffice must be used within a OfficeProvider");
  }
  return context;
}



export const LAST_SELECTED_OFFICE_KEY = "makase.com:selectedOfficeId";

export const getOfficeRedirectPath = (user: UserProfileWithOffices) => {
  return `/o/${user?.offices?.[0]?.slug}`;
};