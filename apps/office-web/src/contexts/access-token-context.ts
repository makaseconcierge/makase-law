import { createContext, useContext } from "react";

export const AccessTokenContext = createContext<string | null>(null);

export function useAccessToken() {
  return useContext(AccessTokenContext);
}