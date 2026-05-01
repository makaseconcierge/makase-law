import { useUserProfileWithOffices } from "@/contexts/user-context";
import { OfficeContext } from "@/contexts/office-context";
import { mergeRolePermissions } from "@makase-law/utils";
import { useGET } from "@/apis/use-simple-swr";
import { SelectedOfficeIdContext } from "./selected-office-id-context";
import LoadingDashboard from "@/components/dashboard/loading-dashboard";
import { Redirect, Route, Switch, useParams } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { LAST_SELECTED_OFFICE_KEY, getOfficeRedirectPath } from "./office-context";

function OfficeContextFetcher({ children }: { children: React.ReactNode }) {
  const officeInfo = useGET(`/info`);
  const teams = useGET(`/my/teams`);
  const roles = useGET(`/my/roles`);
  const employment = useGET(`/my/employment`);

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


function OfficeSlugWrapper({children}: {children: React.ReactNode}) {
  const user = useUserProfileWithOffices();
  const { office_slug } = useParams();

  console.log('office_slug', office_slug);

  if (!office_slug) return <Redirect to={getOfficeRedirectPath(user)} />;

  const selectedOfficeId = user?.offices?.find((o) => o.slug === office_slug)?.office_id;
  const selectOfficeId = (office_id: string) => {
    localStorage.setItem(LAST_SELECTED_OFFICE_KEY, office_id);
    const officeSlug = user?.offices?.find((o) => o.office_id === office_id)?.slug;
    if (officeSlug) navigate(`/o/${officeSlug}`);
    else throw new Error(`Office ${office_id} not found for this user: ${JSON.stringify(user || {})}`);
  };

  if (!selectedOfficeId) return <div>404 Not Found</div>;
console.log('selectedOfficeId', selectedOfficeId);
  return (
    <SelectedOfficeIdContext.Provider value={{ selectedOfficeId, selectOfficeId }}>
      {children}
    </SelectedOfficeIdContext.Provider>
  );
}

export default function OfficeContextProvider({ children }: { children: React.ReactNode }) {
  const user = useUserProfileWithOffices();
  if (!user) return <LoadingDashboard />;
  if (user.offices.length === 0) return <div>No offices found</div>;

  return (
    <Switch>
      <Route path="/:office_slug">
        <OfficeSlugWrapper>
          <OfficeContextFetcher>{children}</OfficeContextFetcher>
        </OfficeSlugWrapper>
      </Route>
      <Route path="/" component={() => <Redirect to={getOfficeRedirectPath(user)} />} />
    </Switch>
  );
}
