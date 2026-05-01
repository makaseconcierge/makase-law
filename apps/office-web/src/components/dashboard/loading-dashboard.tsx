import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-is-mobile"

export default function LoadingDashboard() {

  const mobile = useIsMobile()

  return <div className="w-screen h-screen p-2 overflow-clip flex flex-row gap-3">
    {!mobile && <Skeleton className="h-full w-[16rem]" />}
    <div className="flex flex-col gap-3 flex-grow">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="w-full flex-grow" />
    </div>
  </div>
}