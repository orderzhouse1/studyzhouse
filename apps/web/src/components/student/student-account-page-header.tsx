import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { cn } from "@/lib/utils";

export function StudentAccountPageHeader({
  eyebrow,
  title,
  description,
  backHref = "/student",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  backHref?: string;
}): React.ReactElement {
  return (
    <header className={cn("border-b border-border/60 bg-card/50", STUDENT_CONTENT_PAD)}>
      <div className="mx-auto w-full max-w-3xl space-y-2 py-5 sm:py-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          العودة للوحة التحكم
        </Link>
        <p className="text-xs font-semibold text-primary">{eyebrow}</p>
        <h1 className="text-2xl font-bold text-heading sm:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </header>
  );
}
