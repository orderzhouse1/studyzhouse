"use client";

import {
  Bell,
  BookOpen,
  CheckCheck,
  CreditCard,
  GraduationCap,
  KeyRound,
  Loader2,
  UserPlus,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { StudentAccountPageHeader } from "@/components/student/student-account-page-header";
import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { Button } from "@/components/ui/button";
import {
  fetchStudentNotifications,
  markAllStudentNotificationsRead,
  markStudentNotificationRead,
} from "@/lib/student-notifications-api";
import { cn } from "@/lib/utils";
import type { NotificationItem, NotificationType } from "@studyhouse/shared";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function NotificationIcon({
  type,
  className,
}: {
  type: NotificationType;
  className?: string;
}): React.ReactElement {
  const props = { className: cn("h-5 w-5 shrink-0", className), "aria-hidden": true as const };
  switch (type) {
    case "PAYMENT_APPROVED":
      return <CreditCard {...props} />;
    case "PAYMENT_REJECTED":
      return <XCircle {...props} />;
    case "COURSE_ENROLLED":
      return <UserPlus {...props} />;
    case "COURSE_REVOKED":
      return <BookOpen {...props} />;
    case "ACTIVATION_CODE_REDEEMED":
      return <KeyRound {...props} />;
    default:
      return <Bell {...props} />;
  }
}

export function StudentNotificationsPanel(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const out = await fetchStudentNotifications();
      setItems(out.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onMarkAllRead(): Promise<void> {
    setMarkingAll(true);
    try {
      await markAllStudentNotificationsRead();
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
      );
    } finally {
      setMarkingAll(false);
    }
  }

  async function onMarkRead(id: string): Promise<void> {
    await markStudentNotificationRead(id);
    setItems((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, readAt: n.readAt ?? new Date().toISOString() }
          : n,
      ),
    );
  }

  const hasUnread = items.some((n) => !n.readAt);

  return (
    <div>
      <StudentAccountPageHeader
        eyebrow="حسابي"
        title="الإشعارات"
        description="تابع آخر التحديثات المهمة على حسابك وكورساتك."
      />

      <div className={cn(STUDENT_CONTENT_PAD, "mx-auto w-full max-w-3xl py-6")}>
        {items.length > 0 ? (
          <div className="mb-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasUnread || markingAll}
              onClick={() => void onMarkAllRead()}
            >
              {markingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CheckCheck className="h-4 w-4" aria-hidden />
              )}
              تحديد الكل كمقروء
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2
              className="h-8 w-8 animate-spin text-muted-foreground"
              aria-hidden
            />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center">
            <GraduationCap
              className="mx-auto h-10 w-10 text-muted-foreground/60"
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-heading">
              لا توجد إشعارات بعد.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => {
              const unread = !n.readAt;
              return (
                <li
                  key={n.id}
                  className={cn(
                    "rounded-2xl border bg-card p-4 shadow-sm transition",
                    unread
                      ? "border-primary/25 bg-primary/[0.03]"
                      : "border-border/80",
                  )}
                >
                  <div className="flex gap-3">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full",
                        unread
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <NotificationIcon type={n.type} />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-heading">{n.title}</p>
                        <time
                          className="shrink-0 text-xs text-muted-foreground"
                          dateTime={n.createdAt}
                        >
                          {formatDate(n.createdAt)}
                        </time>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {n.body}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {n.actionUrl ? (
                          <Button asChild size="sm" variant="default">
                            <Link href={n.actionUrl}>عرض التفاصيل</Link>
                          </Button>
                        ) : null}
                        {unread ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => void onMarkRead(n.id)}
                          >
                            تحديد كمقروء
                          </Button>
                        ) : null}
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
