"use client";

import { BookOpen, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { StudentAccountPageHeader } from "@/components/student/student-account-page-header";
import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchStudentPurchases } from "@/lib/student-purchases-api";
import { cn } from "@/lib/utils";
import type {
  StudentPurchaseItem,
  StudentPurchaseStatus,
} from "@studyhouse/shared";

type FilterTab = "ALL" | StudentPurchaseStatus;

const TABS: Array<{ id: FilterTab; label: string }> = [
  { id: "ALL", label: "الكل" },
  { id: "PENDING", label: "قيد المراجعة" },
  { id: "APPROVED", label: "مقبولة" },
  { id: "REJECTED", label: "مرفوضة" },
  { id: "ACTIVE", label: "مفعّلة" },
];

const SOURCE_LABELS: Record<StudentPurchaseItem["source"], string> = {
  CLIQ_PAYMENT: "دفع CliQ",
  ACTIVATION_CODE: "كود تفعيل",
  MANUAL_ADMIN: "تسجيل إداري",
  FREE: "مجاني",
  MANUAL: "يدوي",
  UNKNOWN: "أخرى",
};

const STATUS_LABELS: Record<StudentPurchaseStatus, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  ACTIVE: "مفعّل",
  REVOKED: "ملغى",
  COMPLETED: "مكتمل",
};

function statusVariant(
  status: StudentPurchaseStatus,
): "default" | "secondary" | "success" | "warning" | "archived" | "outline" {
  if (status === "ACTIVE" || status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED" || status === "REVOKED") return "archived";
  return "outline";
}

function matchesTab(item: StudentPurchaseItem, tab: FilterTab): boolean {
  if (tab === "ALL") return true;
  if (tab === "ACTIVE") return item.canLearn || item.status === "ACTIVE";
  return item.status === tab;
}

export function StudentPurchasesPanel(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StudentPurchaseItem[]>([]);
  const [tab, setTab] = useState<FilterTab>("ALL");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      setItems(await fetchStudentPurchases());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => items.filter((item) => matchesTab(item, tab)),
    [items, tab],
  );

  return (
    <>
      <StudentAccountPageHeader
        eyebrow="حسابي"
        title="مشترياتي"
        description="سجل الوصول للكورسات عبر الدفع، أكواد التفعيل، أو التسجيل الإداري."
      />
      <div className={cn("pb-16", STUDENT_CONTENT_PAD)}>
        <div className="mx-auto w-full max-w-3xl space-y-4 py-6 md:py-8">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  tab === t.id
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/70 bg-muted/20 text-muted-foreground hover:border-primary/30",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex min-h-[24vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 px-6 py-12 text-center">
              <ShoppingBag
                className="mx-auto h-10 w-10 text-muted-foreground/50"
                aria-hidden
              />
              <p className="mt-3 text-sm font-medium text-heading">
                لا توجد مشتريات أو طلبات تفعيل بعد.
              </p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/student/explore">استكشف الكورسات</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((item) => (
                <li
                  key={`${item.source}-${item.id}`}
                  className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm ring-1 ring-border/50 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-heading">{item.course.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {SOURCE_LABELS[item.source]}
                        {item.amount
                          ? ` · ${item.amount} ${item.currency ?? "JOD"}`
                          : null}
                      </p>
                      {item.transactionReference ? (
                        <p
                          dir="ltr"
                          className="mt-1 truncate text-start text-xs text-muted-foreground"
                        >
                          مرجع: {item.transactionReference}
                        </p>
                      ) : null}
                      {item.rejectionReason ? (
                        <p className="mt-2 text-xs text-destructive">
                          {item.rejectionReason}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[0.65rem] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("ar-JO", {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={statusVariant(item.status)}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                      {item.canLearn && item.learnUrl ? (
                        <Button size="sm" asChild>
                          <Link href={item.learnUrl}>
                            <BookOpen className="h-4 w-4" aria-hidden />
                            ابدأ التعلم
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
