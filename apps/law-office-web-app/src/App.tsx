import { useState, useEffect, useMemo, useCallback } from "react";
import { Router, Route, Switch, useLocation, Link } from "wouter";
import { type Session } from "@supabase/supabase-js";
import { Scale, FolderOpen, FileText, LogOut } from "lucide-react";
import supabase from "@/lib/supabase";
import { API_BASE, setAccessToken } from "@/lib/api";
import AuthContext, { type Office } from "@/contexts/authContext";
import LoginPage from "@/components/login/LoginPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { MattersPage } from "@/pages/MattersPage";
import { MatterDetailPage } from "@/pages/MatterDetailPage";
import {
  DE111SubmissionsListPage,
  DE111ReviewFormPage,
} from "@/components/de111/DE111FormWizard";
import {
  DE140SubmissionsListPage,
  DE140ReviewFormPage,
} from "@/components/de140/DE140FormWizard";
import {
  DE121SubmissionsListPage,
  DE121ReviewFormPage,
} from "@/components/de121/DE121FormWizard";
import { Toaster } from "@/components/ui/sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const [location] = useLocation();
  const active =
    location === href ||
    (href !== "/" && location.startsWith(href.split("?")[0]));
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <Scale className="h-5 w-5 text-primary" />
            <span>Law Office</span>
          </div>
          <nav className="flex flex-1 items-center gap-1">
            <NavLink href="/matters">
              <FolderOpen className="h-4 w-4" />
              Matters
            </NavLink>
            <NavLink href="/forms/form_de_111">
              <FileText className="h-4 w-4" />
              DE-111
            </NavLink>
            <NavLink href="/forms/form_de_121">
              <FileText className="h-4 w-4" />
              DE-121
            </NavLink>
            <NavLink href="/forms/form_de_140">
              <FileText className="h-4 w-4" />
              DE-140
            </NavLink>
          </nav>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
      <LoadingSpinner size={28} />
      <span className="text-sm">Loading…</span>
    </div>
  );
}

interface AuthData {
  user: { id: string; name: string; email: string; phone: string };
  offices: Office[];
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeOfficeId, setActiveOfficeId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.access_token) setAccessToken(session.access_token);
        setSession(session);
      })
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) setAccessToken(session.access_token);
      else setAccessToken(null);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAuthData = useCallback(async () => {
    if (!session?.access_token) return;
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("auth fetch failed");
      const data: AuthData = await res.json();
      setAuthData(data);
      if (data.offices.length > 0 && !activeOfficeId) {
        setActiveOfficeId(data.offices[0].id);
      }
    } catch {
      setAuthData(null);
    } finally {
      setAuthLoading(false);
    }
  }, [session?.access_token, activeOfficeId]);

  useEffect(() => {
    if (session) fetchAuthData();
    else setAuthData(null);
  }, [session, fetchAuthData]);

  const authContextValue = useMemo(() => {
    if (!session?.user || !authData) return undefined;
    return {
      user: session.user,
      dbUser: authData.user,
      offices: authData.offices,
      activeOfficeId,
      setActiveOfficeId,
      refreshAuth: fetchAuthData,
    };
  }, [session?.user, authData, activeOfficeId, fetchAuthData]);

  if (loading) return <LoadingScreen />;

  if (!session) {
    return (
      <>
        <LoginPage />
        <Toaster position="bottom-right" />
      </>
    );
  }

  if (authLoading && !authData) return <LoadingScreen />;

  if (!authData || authData.offices.length === 0) {
    return (
      <>
        <OnboardingPage onComplete={fetchAuthData} />
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue!}>
      <Router>
        <AppShell>
          <Switch>
            <Route path="/matters" component={MattersPage} />
            <Route path="/matters/:matterId" component={MatterDetailPage} />
            <Route
              path="/forms/form_de_111"
              component={DE111SubmissionsListPage}
            />
            <Route
              path="/forms/form_de_111/:formId"
              component={DE111ReviewFormPage}
            />
            <Route
              path="/forms/form_de_121"
              component={DE121SubmissionsListPage}
            />
            <Route
              path="/forms/form_de_121/:formId"
              component={DE121ReviewFormPage}
            />
            <Route
              path="/forms/form_de_140"
              component={DE140SubmissionsListPage}
            />
            <Route
              path="/forms/form_de_140/:formId"
              component={DE140ReviewFormPage}
            />
            <Route>
              <MattersPage />
            </Route>
          </Switch>
        </AppShell>
      </Router>
      <Toaster position="bottom-right" />
    </AuthContext.Provider>
  );
}
