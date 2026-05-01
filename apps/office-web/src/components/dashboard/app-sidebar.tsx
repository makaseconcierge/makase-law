import * as React from "react"
import {
  PuzzleIcon,
  ListTodoIcon,
  User2Icon,
  CreditCardIcon,
  FileTextIcon,
} from "lucide-react"

import { SideMenu } from "@/components/dashboard/side-menu"
import { NavUser } from "@/components/dashboard/nav-user"
import { OfficeSwitcher } from "@/components/dashboard/office-switcher"
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
    submenu: [
      {
        name: "double",
        url: "/billing/doublebilling",
        Icon: CreditCardIcon,
      },
      {
        name: "Invoices",
        url: "/billing/invoices",
        Icon: FileTextIcon,
      },
    ],
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
        <OfficeSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SideMenu menuItems={sideMenu} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* {isAdmin && <SideMenu menuItems={adminMenu} />} */}
      </SidebarFooter>
      <SidebarRail />
        <NavUser />
    </Sidebar>
  )
}
