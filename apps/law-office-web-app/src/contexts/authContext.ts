import { type User } from "@supabase/supabase-js";
import { createContext } from "react";

export interface Office {
  id: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: User;
  dbUser: { id: string; name: string; email: string; phone: string };
  offices: Office[];
  activeOfficeId: string | null;
  setActiveOfficeId: (id: string) => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export default AuthContext;
