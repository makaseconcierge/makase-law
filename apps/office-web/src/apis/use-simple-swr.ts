import useSWR, { type SWRConfiguration } from "swr";
import { useApi, useOfficeApi } from "./use-api";

const simpleSWROptions: SWRConfiguration = {
  revalidateOnFocus: false,      // don't refetch when tab regains focus
  refreshInterval: 0,            // no polling
}



export function useSimpleSWR(key: string, options: SWRConfiguration = simpleSWROptions) {
  const api = useApi();
  return useSWR(key, api, options).data;
}

export function useSimpleOfficeSWR(key: string, options: SWRConfiguration = simpleSWROptions) {
  const api = useOfficeApi();
  return useSWR(key, api, options).data;
}