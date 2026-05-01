import { useState } from "react";
import { useUserProfileWithOffices } from "@/contexts/user-context";
import { OfficeContext } from "@/contexts/office-context";
import { mergeRolePermissions } from "@makase-law/utils";
import { useSimpleOfficeSWR } from "@/apis/use-simple-swr";
import { SelectedOfficeIdContext } from "./selected-office-id-context";
import LoadingDashboard from "@/components/dashboard/loading-dashboard";

const SELECTED_OFFICE_KEY = "makase.com:selectedOfficeId";

function OfficeContextFetcher({ children }: { children: React.ReactNode }) {
  const officeInfo = useSimpleOfficeSWR("/info");
  const teams = useSimpleOfficeSWR("/my/teams");
  const roles = useSimpleOfficeSWR("/my/roles");
  const employment = useSimpleOfficeSWR("/my/employment");

  if (!officeInfo || !teams || !roles || !employment) return <LoadingDashboard />;

  const permissions = mergeRolePermissions(roles);

  return (
    <OfficeContext.Provider
      value={{ officeInfo, teams, permissions, isAdmin: employment.is_admin, roles }}
    >
      {children}
    </OfficeContext.Provider>
  );
}

export default function OfficeContextProvider({ children }: { children: React.ReactNode }) {
  const user = useUserProfileWithOffices();

  const [selectedOfficeId, setSelectedOfficeId] = useState<string | undefined>(() => {
    const stored = localStorage.getItem(SELECTED_OFFICE_KEY) ?? undefined;
    if (stored && user?.offices?.some((o) => o.office_id === stored)) return stored;
    return user?.offices?.[0]?.office_id;
  });

  const selectOfficeId = (office_id: string) => {
    localStorage.setItem(SELECTED_OFFICE_KEY, office_id);
    setSelectedOfficeId(office_id);
  };

  if (!selectedOfficeId) return <LoadingDashboard />;

  return (
    <SelectedOfficeIdContext.Provider value={{ selectedOfficeId, selectOfficeId }}>
      <OfficeContextFetcher>{children}</OfficeContextFetcher>
    </SelectedOfficeIdContext.Provider>
  );
}
