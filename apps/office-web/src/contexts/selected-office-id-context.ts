import { createContext, useContext } from "react";

export const SelectedOfficeIdContext = createContext<{
  selectedOfficeId: string | undefined,
  selectOfficeId: (office_id: string) => void,
} | null>(null);

export function useSelectedOfficeId() {
  const context = useContext(SelectedOfficeIdContext);
  if (!context?.selectedOfficeId) {
    throw new Error("useSelectedOfficeId must be used within a SelectedOfficeIdContext.Provider");
  }
  return context.selectedOfficeId;
}

export function useSelectOfficeId() {
  const context = useContext(SelectedOfficeIdContext);
  if (!context?.selectOfficeId) {
    throw new Error("useSelectOfficeId must be used within a SelectedOfficeIdContext.Provider");
  }
  return context.selectOfficeId;
}
