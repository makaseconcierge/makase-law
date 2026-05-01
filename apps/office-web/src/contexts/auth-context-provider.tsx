import { UserContext } from "@/contexts/user-context";
import { useEffect, useState } from "react";
import supabase from "@/apis/supabase";
import type { Session } from "@supabase/supabase-js";
import LoadingDashboard from "@/components/dashboard/loading-dashboard";
import LoginPage from "@/pages/login/login-page";
import { useBaseGET } from "@/apis/use-makase-swr";
import { AccessTokenContext } from "./access-token-context";
import type { SWRConfiguration } from "swr";

const staticSWROptions: SWRConfiguration = {
  revalidateOnFocus: false,      // don't refetch when tab regains focus
  revalidateOnReconnect: false,  // don't refetch on network reconnect
  refreshInterval: 0,            // no polling
  dedupingInterval: 60_000,      // dedupe requests within 1 min
}

function UserContextProvider({ children }: { children: React.ReactNode }) {
  const userProfile = useBaseGET("/my/profile", staticSWROptions);
  const offices = useBaseGET("/my/offices", staticSWROptions);

  if (!userProfile || !offices) return <LoadingDashboard />;

  return (
    <UserContext.Provider value={{ ...userProfile, offices }}>
      {children}
    </UserContext.Provider>
  );
}

export default function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const href = localStorage.getItem("makase.com:loggedInHref");
      if (href) {
        localStorage.removeItem("makase.com:loggedInHref");
        window.location.href = href;
      }
    }).finally(() => setLoadingCreds(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loadingCreds) return <LoadingDashboard />;
  if (!session?.access_token) return <LoginPage />;

  return (
    <AccessTokenContext.Provider value={session.access_token}>
      <UserContextProvider>
        {children}
      </UserContextProvider>
    </AccessTokenContext.Provider>
  );
}
