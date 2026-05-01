import * as React from "react"
import {
  PuzzleIcon,
  ListTodoIcon,
  User2Icon,
  CreditCardIcon,
} from "lucide-react"

import { SideMenu } from "@/components/dashboard/side-menu"
import { NavUser } from "@/components/dashboard/nav-user"
import { VendorSwitcher } from "@/components/dashboard/vendor-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
} from "@/components/ui/sidebar"



const sideMenu = [
  {
    name: "Leads",
    url: "/leads",
    Icon: User2Icon,
  },
  {
    name: "Matters",
    url: "/matters",
    Icon: PuzzleIcon,
  },
  {
    name: "Tasks",
    url: "/tasks",
    Icon: ListTodoIcon,
  },
  {
    name: "Billing",
    url: "/billing",
    Icon: CreditCardIcon,
  },
]

// const adminMenu = [{
//   name: 'Admin Settings',
//   Icon: Settings,
//   url: '/vendor-admin-settings'
// }];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SideMenu menuItems={sideMenu} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* {isAdmin && <SideMenu menuItems={adminMenu} />} */}
        <VendorSwitcher />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
