
import Dashboard from "@/components/dashboard/dashboard";
import AuthContextProvider from "@/contexts/auth-context-provider";
import OfficeContextProvider from "@/contexts/office-context-provider";
import { Toaster } from "@/components/ui/sonner";

export function App() {


  return (
    <>
      <AuthContextProvider>
        <OfficeContextProvider>
          <Dashboard />
        </OfficeContextProvider>
      </AuthContextProvider>
      <Toaster position="bottom-right" />
    </>
  )
}

export default App
