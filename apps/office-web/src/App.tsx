
import Dashboard from "@/components/dashboard/dashboard";
import AuthContextProvider from "@/contexts/auth-context-provider";
import OfficeContextProvider from "@/contexts/office-context-provider";
import { Toaster } from "@/components/ui/sonner";
import { Route, Switch } from "wouter";
import { useUserProfileWithOffices } from "./contexts/user-context";
import LoadingDashboard from "./components/dashboard/loading-dashboard";
import { Redirect } from "wouter";
import { getOfficeRedirectPath } from "./contexts/office-context";

function AppRoutes() {
  const user = useUserProfileWithOffices();
  if (!user) return <LoadingDashboard />;
  return (
    <Switch>
      <Route path="/o" nest>
        <OfficeContextProvider>
          <Dashboard />
        </OfficeContextProvider>
      </Route>
      {/* <Route path="/u">
        <UserProfile />
      </Route> */}
      <Route path="/" component={() => <Redirect to={getOfficeRedirectPath(user)} />} />
    </Switch>
  );
}

export function App() {
  return (
    <>
      <AuthContextProvider>
        <AppRoutes />
      </AuthContextProvider>
      <Toaster position="bottom-right" />
    </>
  )
}

export default App
