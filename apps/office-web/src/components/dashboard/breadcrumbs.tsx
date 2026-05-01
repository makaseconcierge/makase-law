import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { BreadcrumbLink, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator, Breadcrumb } from "../ui/breadcrumb";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ChevronLeftIcon } from "lucide-react";
import { navigate } from "wouter/use-browser-location";

export default function Breadcrumbs() {

  const {breadcrumbs} = useBreadcrumbs();
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.length > 1 && <Button variant="ghost" size="icon" className="block md:hidden w-4" onClick={() => navigate(breadcrumbs[breadcrumbs.length - 2]?.path || '/')}>
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>}
        {breadcrumbs.map((breadcrumb, index) => [
            index > 0 && <BreadcrumbSeparator key={index + 'separator'} className="hidden md:block" />,
            <BreadcrumbItem key={index + 'item'} className={cn("capitalize", index === breadcrumbs.length - 1 ? "block text-xl md:text-base font-bold md:font-normal text-foreground md:text-muted-foreground" : "hidden md:block")}>
              <BreadcrumbLink render={
                <Link to={breadcrumb.path}>{breadcrumb.label}</Link>
              }/>
            </BreadcrumbItem>
        ])}
      </BreadcrumbList>
    </Breadcrumb>
  )
} 