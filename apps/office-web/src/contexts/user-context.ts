import { createContext, useContext } from "react";
import type { Office, UserProfile } from "@makase-law/types";

export type UserProfileWithOffices = UserProfile & { offices: Partial<Office>[] };

export const UserContext = createContext<UserProfileWithOffices | undefined>(undefined);

export function useUserProfileWithOffices() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}