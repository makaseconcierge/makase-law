import {
  type LucideIcon,
} from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"

type MenuItem = {
  name: string | React.ReactNode
  url: string
  Icon: LucideIcon
  submenu?: MenuItem[]
}

export function SideMenu({
  menuItems,
  isSubmenu = false
}: {
  menuItems: MenuItem[],
  isSubmenu?: boolean
}) {
  const [location] = useLocation();

  return (
    <SidebarMenu>
      {menuItems.map((item, index) => (
        <SidebarMenuItem key={index} >
          <SidebarMenuButton size={isSubmenu ? 'xs' : 'default'} asChild className={cn(location === item.url && "text-primary bg-accent font-semibold", "hover:text-primary active:text-primary", isSubmenu && "rounded-l-none h-5 text-xs")}>
            <Link href={item.url}>
              <item.Icon className="w-4 h-4" />
              <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
            </Link>
          </SidebarMenuButton>
          {item.submenu && location?.includes(item.url) && (
            <div className="ml-2 border-l-2 group-data-[collapsible=icon]:ml-1">
              <SideMenu menuItems={item.submenu} isSubmenu={true} />
            </div>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
