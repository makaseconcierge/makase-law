import { Building2, ChevronsUpDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useOffice, useOffices } from "@/contexts/office-context"
import { useSelectOfficeId } from "@/contexts/selected-office-id-context"

export function OfficeSwitcher() {
  const { isMobile } = useSidebar()
  const { officeInfo } = useOffice()
  const offices = useOffices()
  const selectOfficeId = useSelectOfficeId()

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=expanded]:bg-sidebar-accent data-[state=expanded]:text-sidebar-accent-foreground bg-sidebar-accent/70"
              >
                <div className="grid flex-1 justify-start group-data-[state=collapsed]:justify-center text-sm leading-tight">
                  <span className="truncate font-semibold">
                    <span className="group-data-[state=collapsed]:hidden">{officeInfo.name}</span>
                    <Building2 className="size-4 hidden group-data-[collapsible=icon]:block" />
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto group-data-[state=collapsed]:hidden" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-stone-500 text-xs dark:text-stone-400">
                Offices
              </DropdownMenuLabel>
              {offices.map((office) => (
                <DropdownMenuItem
                  key={office.office_id}
                  onClick={() => office.office_id && selectOfficeId(office.office_id)}
                  className="gap-2 p-2"
                >
                  {office.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
