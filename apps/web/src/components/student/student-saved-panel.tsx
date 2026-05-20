"use client";

import { Bookmark, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { StudentAccountPageHeader } from "@/components/student/student-account-page-header";
import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchStudentSavedCourses,
  unsaveStudentCourse,
} from "@/lib/student-saved-courses-api";
import { cn } from "@/lib/utils";
import type { StudentSavedCourseItem } from "@studyhouse/shared";

function levelLabel(level: string): string {
  const map: Record<string, string> = {
    BEGINNER: "مبتدئ",
    INTERMEDIATE: "متوسط",
    ADVANCED: "متقدم",
    ALL_LEVELS: "جميع المستويات",
  };
  return map[level] ?? level;
}

function formatPrice(item: StudentSavedCourseItem): string {
  if (item.course.pricingType === "FREE") return "مجاني";
  const amount = item.course.priceAmount ?? "—";
  return `${item.course.currency} ${amount}`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export function StudentSavedPanel(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StudentSavedCourseItem[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      setItems(await fetchStudentSavedCourses());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRemove(courseId: string): Promise<void> {
    setRemovingId(courseId);
    try {
      await unsaveStudentCourse(courseId);
      setItems((prev) => prev.filter((i) => i.courseId !== courseId));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <StudentAccountPageHeader
        eyebrow="حسابي"
        title="المحفوظات"
        description="الكورسات التي حفظتها للرجوع إليها لاحقًا."
      />

      <div className={cn(STUDENT_CONTENT_PAD, "mx-auto w-full max-w-3xl py-6")}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2
              className="h-8 w-8 animate-spin text-muted-foreground"
              aria-hidden
            />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center">
            <Bookmark
              className="mx-auto h-10 w-10 text-muted-foreground/60"
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-heading">
              لم تحفظ أي كورس بعد.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/student/explore">استكشف الكورسات</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => {
              const detailHref = `/student/courses/${item.course.slug}`;
              const removing = removingId === item.courseId;
              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {item.course.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.course.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.course.category ? (
                          <Badge variant="secondary" className="text-xs">
                            {item.course.category.name}
                          </Badge>
                        ) : null}
                        <Badge
                          variant={
                            item.course.pricingType === "FREE"
                              ? "free"
                              : "paid"
                          }
                          className="text-xs"
                        >
                          {formatPrice(item)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {levelLabel(item.course.level)}
                        </Badge>
                      </div>
                      <h2 className="font-bold text-heading">
                        {item.course.title}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        حُفظ في {formatDate(item.savedAt)}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button asChild size="sm">
                          <Link href={detailHref}>عرض الكورس</Link>
                        </Button>
                        {item.canLearn && item.learnUrl ? (
                          <Button asChild size="sm" variant="secondary">
                            <Link href={item.learnUrl}>ابدأ التعلم</Link>
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={removing}
                          onClick={() => void onRemove(item.courseId)}
                        >
                          {removing ? (
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden
                            />
                          ) : null}
                          إزالة
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
