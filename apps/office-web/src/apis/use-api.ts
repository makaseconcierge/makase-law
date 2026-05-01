import { useAccessToken } from "@/contexts/access-token-context";
import { useSelectedOfficeId } from "@/contexts/selected-office-id-context";
import { useCallback } from "react";

export function useApi(basePath: string = '') {
  const accessToken = useAccessToken();
  return useCallback((...args: Parameters<typeof fetch>) => {
    args[1] = args[1] || {};
    args[1].headers = {
      ...args[1].headers,
      Authorization: `Bearer ${accessToken}`,
    };
    return fetch(`${import.meta.env.VITE_API_URL}${basePath}${args[0]}`, args[1]).then(res => res.json());
  }, [accessToken, basePath]);
}

export function useOfficeApi() {
  const officeId = useSelectedOfficeId();
  return useApi(`/office/${officeId}`);
}
