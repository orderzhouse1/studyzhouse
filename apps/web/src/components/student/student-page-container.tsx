import { cn } from "@/lib/utils";

export function StudentPageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:px-8 lg:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
