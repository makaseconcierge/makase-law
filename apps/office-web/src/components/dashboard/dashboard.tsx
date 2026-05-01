import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Routes from "./routes"
import Breadcrumbs from "./breadcrumbs"

export default function Dashboard() {

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="max-h-screen max-w-screen w-full overflow-x-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumbs/>
          </div>
        </header>
        <Routes />
      </SidebarInset>
    </SidebarProvider>
  )
}
