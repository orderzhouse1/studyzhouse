"use client";

import {
  ArrowLeft,
  BookOpen,
  Loader2,
  ShieldOff,
  UserPen,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

type StudentSafe = {
  id: string;
  fullName: string;
  email: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "DELETED";
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
};

type EnrollmentRow = {
  id: string;
  status: "ACTIVE" | "REVOKED" | "COMPLETED";
  source: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  startedAt: string | null;
  completedAt: string | null;
  lastActivityAt: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    pricingType: string;
    category: null | { name: string };
  };
};

type AvailableCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  pricingType: string;
  category: null | { name: string };
};

type DetailResponse = {
  success: true;
  data: {
    student: StudentSafe;
    enrollments: EnrollmentRow[];
    availableCourses: AvailableCourse[];
  };
};

const STATUS_LABEL: Record<StudentSafe["status"], string> = {
  ACTIVE: "نشط",
  PENDING: "بانتظار التفعيل",
  SUSPENDED: "موقوف",
  DELETED: "محذوف",
};

function statusBadgeVariant(
  s: StudentSafe["status"],
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "ACTIVE") return "success";
  if (s === "PENDING") return "warning";
  if (s === "SUSPENDED") return "warning";
  return "muted";
}

const ENROLL_STATUS_LABEL: Record<EnrollmentRow["status"], string> = {
  ACTIVE: "نشط",
  REVOKED: "ملغى",
  COMPLETED: "مكتمل",
};

function enrollVariant(
  s: EnrollmentRow["status"],
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "ACTIVE") return "success";
  if (s === "COMPLETED") return "secondary";
  return "muted";
}

function sourceLabel(s: string): string {
  switch (s) {
    case "MANUAL_ADMIN":
      return "تسجيل يدوي — الإدارة";
    case "FREE":
      return "مجاني";
    case "MANUAL":
      return "يدوي";
    default:
      return s;
  }
}

export function AdminStudentDetailClient({
  studentId,
}: {
  studentId: string;
}): React.ReactElement {
  const [data, setData] = useState<DetailResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] =
    useState<StudentSafe["status"]>("ACTIVE");
  const [editPw, setEditPw] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const [busyEnrollmentId, setBusyEnrollmentId] = useState<string | null>(
    null,
  );

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<DetailResponse>(
        `/admin/students/${studentId}`,
      );
      setData(json.data);
      setEditName(json.data.student.fullName);
      setEditStatus(json.data.student.status);
      setEditPw("");
      setEnrollCourseId("");
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "تعذّر التحميل.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProfile(): Promise<void> {
    setSavingProfile(true);
    try {
      const body: Record<string, unknown> = {
        fullName: editName.trim(),
        status: editStatus,
      };
      if (editPw.trim().length >= 8) {
        body.password = editPw.trim();
      }
      await adminFetchJson(`/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setEditPw("");
      await load();
    } catch (e) {
      window.alert(
        e instanceof AdminApiError ? e.message : "تعذّر حفظ التعديلات.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function enroll(): Promise<void> {
    if (!enrollCourseId) return;
    setEnrolling(true);
    try {
      await adminFetchJson(`/admin/students/${studentId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: enrollCourseId }),
      });
      await load();
    } catch (e) {
      window.alert(
        e instanceof AdminApiError ? e.message : "تعذّر التسجيل في الكورس.",
      );
    } finally {
      setEnrolling(false);
    }
  }

  async function revokeEnrollment(enrollmentId: string): Promise<void> {
    if (
      !window.confirm(
        "إلغاء تسجيل هذا الطالب في الكورس؟ لن يتمكن من متابعة التعلّم حتى يُعاد التسجيل.",
      )
    ) {
      return;
    }
    setBusyEnrollmentId(enrollmentId);
    try {
      await adminFetchJson(
        `/admin/students/${studentId}/enrollments/${enrollmentId}`,
        { method: "DELETE" },
      );
      await load();
    } catch (e) {
      window.alert(
        e instanceof AdminApiError ? e.message : "تعذّر إلغاء التسجيل.",
      );
    } finally {
      setBusyEnrollmentId(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">جاري التحميل…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-6 text-sm text-red-900">
        {error ?? "غير موجود"}
        <div className="mt-3">
          <Button variant="outline" asChild className="rounded-xl">
            <Link href="/admin/students">العودة للقائمة</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { student, enrollments, availableCourses } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الطلاب"
        title={student.fullName}
        description={student.email}
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/students">
              <ArrowLeft className="ms-1 h-4 w-4" aria-hidden />
              القائمة
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={statusBadgeVariant(student.status)}>
          {STATUS_LABEL[student.status]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          أُنشئ في{" "}
          {new Date(student.createdAt).toLocaleDateString("ar-JO", {
            dateStyle: "medium",
          })}
        </span>
        {student.lastLoginAt ? (
          <span className="text-xs text-muted-foreground">
            · آخر دخول{" "}
            {new Date(student.lastLoginAt).toLocaleDateString("ar-JO", {
              dateStyle: "short",
            })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">· لم يسجّل دخولًا بعد</span>
        )}
      </div>

      <Card className="rounded-3xl border-border shadow-card ring-1 ring-border/60">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <UserPen className="h-5 w-5 text-primary" aria-hidden />
          <div>
            <CardTitle className="text-lg">تعديل البيانات</CardTitle>
            <CardDescription>الاسم، الحالة، وإعادة تعيين كلمة المرور.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ed-name">الاسم</Label>
              <Input
                id="ed-name"
                className="rounded-2xl"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-status">الحالة</Label>
              <select
                id="ed-status"
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(e.target.value as StudentSafe["status"])
                }
              >
                <option value="ACTIVE">نشط</option>
                <option value="SUSPENDED">موقوف</option>
                <option value="DELETED">محذوف</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ed-pw">كلمة مرور جديدة (اختياري)</Label>
            <Input
              id="ed-pw"
              dir="ltr"
              type="password"
              autoComplete="new-password"
              className="max-w-md rounded-2xl text-left"
              minLength={8}
              value={editPw}
              onChange={(e) => setEditPw(e.target.value)}
              placeholder="اتركه فارغًا إن لم يتغيّر"
            />
          </div>
          <Button
            type="button"
            disabled={savingProfile}
            className="rounded-xl bg-primary shadow-brand"
            onClick={() => void saveProfile()}
          >
            {savingProfile ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            حفظ التعديلات
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/8 via-card to-secondary/15 shadow-card ring-1 ring-primary/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden />
            التسجيلات في الكورسات
          </CardTitle>
          <CardDescription>
            التقدّم محسوب من الدروس المنشورة فقط.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableCourses.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-4 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="pick-course">إضافة كورس منشور</Label>
                <select
                  id="pick-course"
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                  value={enrollCourseId}
                  onChange={(e) => setEnrollCourseId(e.target.value)}
                >
                  <option value="">اختر كورسًا…</option>
                  {availableCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                      {c.category ? ` — ${c.category.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                disabled={!enrollCourseId || enrolling}
                className="rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600"
                onClick={() => void enroll()}
              >
                {enrolling ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                تسجيل في الكورس
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              لا توجد كورسات منشورة متاحة للتسجيل الإضافي، أو الطالب مسجّل في كل
              الكورسات النشطة.
            </p>
          )}

          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد تسجيلات بعد.</p>
          ) : (
            <div className="space-y-3">
              {enrollments.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold leading-snug">{row.course.title}</p>
                      <Badge variant={enrollVariant(row.status)}>
                        {ENROLL_STATUS_LABEL[row.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {sourceLabel(row.source)} ·{" "}
                      {row.completedLessons}/{row.totalLessons} درسًا ·{" "}
                      {row.progressPercent}%
                    </p>
                    {row.lastActivityAt ? (
                      <p className="text-[11px] text-muted-foreground">
                        آخر نشاط:{" "}
                        {new Date(row.lastActivityAt).toLocaleString("ar-JO")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {row.status === "ACTIVE" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-red-200 text-red-800 hover:bg-red-50"
                          disabled={busyEnrollmentId === row.id}
                          onClick={() => void revokeEnrollment(row.id)}
                        >
                          {busyEnrollmentId === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ShieldOff className="me-1 h-4 w-4" aria-hidden />
                              إلغاء التسجيل
                            </>
                          )}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
