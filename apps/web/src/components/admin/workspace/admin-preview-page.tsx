import { Construction } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AdminPreviewPage({
  title,
  description,
  backHref,
}: {
  title: string;
  description: string;
  backHref: string;
}): React.ReactElement {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card px-6 py-16 text-center shadow-sm">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Construction className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
        معاينة الواجهة
      </p>
      <h1 className="mt-2 text-xl font-bold text-heading">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Button asChild className="mt-6 rounded-xl shadow-brand">
        <Link href={backHref}>العودة إلى لوحة الإدارة</Link>
      </Button>
    </div>
  );
}
