import useSWR, { type SWRConfiguration } from "swr";
import { useApi } from "./use-api";
import { useSelectedOfficeId } from "@/contexts/selected-office-id-context";

const simpleSWROptions: SWRConfiguration = {
  revalidateOnFocus: false,      // don't refetch when tab regains focus
  refreshInterval: 0,            // no polling
}



export function useBaseGET(key: string, options: SWRConfiguration = simpleSWROptions) {
  const api = useApi();
  return useSWR(key, api, options).data;
}

export function useOfficeScopedGET(key: string, options: SWRConfiguration = simpleSWROptions) {
  const selectedOfficeId = useSelectedOfficeId();
  const api = useApi(`/office/${selectedOfficeId}`);
  return useSWR(key, api, options).data;
}

export const useGET = useOfficeScopedGET;