import { useContext } from "react"
import { Building2, ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import VendorContext from "@/contexts/vendorContext"
import { useLocation } from "wouter"


export function VendorSwitcher() {
  const [,navigate] = useLocation();
  const { isMobile } = useSidebar()
  const {activeVendor, setActiveVendorId, availableVendors} = useContext(VendorContext)

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=expanded]:bg-sidebar-accent data-[state=expanded]:text-sidebar-accent-foreground bg-sidebar-accent/70"
            >
              {/* <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                 <activeVendor.logo className="size-4" />
              </div> */}
              <div className="grid flex-1 justify-start group-data-[state=collapsed]:justify-center text-sm leading-tight">
                <span className="truncate font-semibold">
                  <span className="group-data-[state=collapsed]:hidden">{activeVendor?.vendor_name}</span>
                  <Building2 className="size-4 hidden group-data-[collapsible=icon]:block" />
                </span>
              </div>
              <ChevronsUpDown className="ml-auto group-data-[state=collapsed]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-stone-500 text-xs dark:text-stone-400">
              Vendor Accounts
            </DropdownMenuLabel>
            {availableVendors?.map((vendor: any) => (
              <DropdownMenuItem
                key={vendor.vendor_name}
                onClick={() => setActiveVendorId(vendor.id)}
                className="gap-2 p-2"
              >
                {/* <div className="flex size-6 items-center justify-center rounded-xs border">
                  <vendor.logo className="size-4 shrink-0" />
                </div> */}
                {vendor.vendor_name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={() => navigate('/add-vendor')}>
              <div className="bg-white flex size-6 items-center justify-center rounded-md border dark:bg-stone-950">
                <Plus className="size-4" />
              </div>
              <div className="text-stone-500 font-medium dark:text-stone-400">Add Vendor</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
