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
  const lastId = localStorage.getItem(LAST_SELECTED_OFFICE_KEY);
  const office = (lastId && user?.offices?.find(o => o.office_id === lastId)) || user?.offices?.[0];
  return `/o/${office?.slug}`;
};
