import { cn } from "@/lib/utils";

function Pulse({ className }: { className?: string }): React.ReactElement {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-white/10", className)}
      aria-hidden
    />
  );
}

export function SameCategoryCoursesSkeleton(): React.ReactElement {
  return (
    <section
      className="relative w-full scroll-mt-24 overflow-x-hidden"
      aria-busy
      aria-label="جاري تحميل كورسات من نفس الصنف"
    >
      <div className="mx-auto w-full max-w-[min(100%,88rem)] px-4 sm:px-6 md:px-8">
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.75rem] border-[3px] border-primary/45 p-4 sm:rounded-[2rem] sm:p-6 lg:p-7",
            "bg-[linear-gradient(118deg,hsl(222_47%_10%)_0%,hsl(222_47%_17%)_38%,hsl(265_38%_24%)_72%,hsl(222_47%_14%)_100%)]",
          )}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8">
            <div className="flex shrink-0 flex-col justify-center space-y-3 lg:w-[15.5rem] xl:w-[17rem]">
              <Pulse className="h-4 w-24" />
              <Pulse className="h-7 w-44" />
              <Pulse className="h-4 w-full max-w-xs" />
              <Pulse className="mt-2 h-10 w-28 rounded-xl" />
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-3.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/15">
                  <Pulse className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-2 p-3.5">
                    <Pulse className="h-3 w-20" />
                    <Pulse className="h-4 w-full" />
                    <Pulse className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
