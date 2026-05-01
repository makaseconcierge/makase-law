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
          <Link href={item.url} className="flex items-center gap-2 py-1">
            <SidebarMenuButton size={isSubmenu ? "sm" : "default"} className={
              cn("hover:text-primary active:text-primary",
              location === item.url ?
                "text-secondary bg-accent font-semibold hover:text-secondary hover:bg-accent/90"
                : location.includes(item.url) && "border-l-2 border-t-1 rounded-r-none rounded-b-none ml-2 border-accent/10 font-bold ",
              isSubmenu && "rounded-l-none h-5 text-xs")
            }>
                <item.Icon className={cn("w-2 h-4", isSubmenu && "ml-[-5px]")}/>
                <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
            </SidebarMenuButton>
          </Link>
          {item.submenu && location?.includes(item.url) && (
            <div className="ml-2 border-l-2 pt-[3px] mt-[-4px] group-data-[collapsible=icon]:ml-1">
              <SideMenu menuItems={item.submenu} isSubmenu={true} />
            </div>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
