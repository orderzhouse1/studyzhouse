"use client";

import { BookOpen, Loader2, ShieldOff, Sparkles, UserPen, X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";

type StudentStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "DELETED";

type EnrollmentRow = {
  id: string;
  status: "ACTIVE" | "REVOKED" | "COMPLETED";
  source: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastActivityAt: string | null;
  course: {
    id: string;
    title: string;
    category: null | { name: string };
  };
};

type AvailableCourse = {
  id: string;
  title: string;
  category: null | { name: string };
};

type DetailResponse = {
  success: true;
  data: {
    student: {
      id: string;
      fullName: string;
      email: string;
      status: StudentStatus;
      createdAt: string;
      lastLoginAt: string | null;
    };
    enrollments: EnrollmentRow[];
    availableCourses: AvailableCourse[];
  };
};

type CreateResponse = {
  success: true;
  data: {
    student: { id: string };
    generatedPassword?: string;
  };
};

const STATUS_LABEL: Record<StudentStatus, string> = {
  ACTIVE: "نشط",
  PENDING: "بانتظار التفعيل",
  SUSPENDED: "موقوف",
  DELETED: "محذوف",
};

const ENROLL_STATUS_LABEL: Record<EnrollmentRow["status"], string> = {
  ACTIVE: "نشط",
  REVOKED: "ملغى",
  COMPLETED: "مكتمل",
};

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

export function AdminStudentComposer({
  editStudentId = null,
  onCancel,
  onSaved,
  onStartNew,
}: {
  editStudentId?: string | null;
  onCancel: () => void;
  onSaved: () => void;
  onStartNew?: () => void;
}): React.ReactElement {
  const isEditMode = Boolean(editStudentId);
  const formId = useId();

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<DetailResponse["data"] | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE");
  const [editStatus, setEditStatus] = useState<StudentStatus>("ACTIVE");

  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [busyEnrollmentId, setBusyEnrollmentId] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [savedPasswordHint, setSavedPasswordHint] = useState<string | null>(
    null,
  );

  const loadDetail = useCallback(async (): Promise<void> => {
    if (!editStudentId) return;
    setLoadingDetail(true);
    setFieldError(null);
    try {
      const json = await adminFetchJson<DetailResponse>(
        `/admin/students/${editStudentId}`,
      );
      setDetail(json.data);
      setFullName(json.data.student.fullName);
      setEditStatus(json.data.student.status);
      setPassword("");
      setEnrollCourseId("");
    } catch (err) {
      setDetail(null);
      setFieldError(
        err instanceof Error ? err.message : "تعذّر تحميل بيانات الطالب.",
      );
    } finally {
      setLoadingDetail(false);
    }
  }, [editStudentId]);

  useEffect(() => {
    if (editStudentId) {
      void loadDetail();
    } else {
      setDetail(null);
      setFullName("");
      setEmail("");
      setPassword("");
      setStatus("ACTIVE");
      setFieldError(null);
      setSavedLabel(null);
      setSavedPasswordHint(null);
    }
  }, [editStudentId, loadDetail]);

  async function handleCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFieldError(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        status,
      };
      if (password.trim().length >= 8) {
        body.password = password.trim();
      }
      const json = await adminFetchJson<CreateResponse>(`/admin/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSavedLabel(fullName.trim());
      if (json.data.generatedPassword) {
        setSavedPasswordHint(json.data.generatedPassword);
      }
      onSaved();
    } catch (err) {
      setFieldError(
        err instanceof AdminApiError
          ? err.message
          : "تعذّر إنشاء الطالب.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveProfile(): Promise<void> {
    if (!editStudentId) return;
    setFieldError(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        fullName: fullName.trim(),
        status: editStatus,
      };
      if (password.trim().length >= 8) {
        body.password = password.trim();
      }
      await adminFetchJson(`/admin/students/${editStudentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSavedLabel(fullName.trim());
      setPassword("");
      await loadDetail();
      onSaved();
    } catch (err) {
      setFieldError(
        err instanceof AdminApiError
          ? err.message
          : "تعذّر حفظ التعديلات.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function enroll(): Promise<void> {
    if (!editStudentId || !enrollCourseId) return;
    setEnrolling(true);
    try {
      await adminFetchJson(`/admin/students/${editStudentId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: enrollCourseId }),
      });
      setEnrollCourseId("");
      await loadDetail();
      onSaved();
    } catch (err) {
      window.alert(
        err instanceof AdminApiError ? err.message : "تعذّر التسجيل في الكورس.",
      );
    } finally {
      setEnrolling(false);
    }
  }

  async function revokeEnrollment(enrollmentId: string): Promise<void> {
    if (!editStudentId) return;
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
        `/admin/students/${editStudentId}/enrollments/${enrollmentId}`,
        { method: "DELETE" },
      );
      await loadDetail();
      onSaved();
    } catch (err) {
      window.alert(
        err instanceof AdminApiError ? err.message : "تعذّر إلغاء التسجيل.",
      );
    } finally {
      setBusyEnrollmentId(null);
    }
  }

  if (savedLabel) {
    return (
      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-3 text-center shadow-sm">
        <p className="text-xs font-bold text-emerald-900">
          {isEditMode ? "تم حفظ التعديلات بنجاح" : "تم إنشاء الطالب بنجاح"}
        </p>
        <p className="mt-0.5 text-[0.6875rem] text-emerald-800/90">
          «{savedLabel}» {isEditMode ? "محدّث في القائمة." : "يظهر الآن في الجدول."}
        </p>
        {savedPasswordHint ? (
          <p className="mt-2 rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-1.5 text-[0.625rem] text-amber-950">
            كلمة المرور المؤقتة (احفظها الآن):{" "}
            <span dir="ltr" className="font-mono font-semibold">
              {savedPasswordHint}
            </span>
          </p>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2.5 h-7 rounded-full px-3 text-[0.6875rem]"
          onClick={() => {
            setFullName("");
            setEmail("");
            setPassword("");
            setStatus("ACTIVE");
            setSavedLabel(null);
            setSavedPasswordHint(null);
            onStartNew?.();
          }}
        >
          {isEditMode ? "العودة للقائمة" : "إضافة طالب آخر"}
        </Button>
      </div>
    );
  }

  const enrollments = detail?.enrollments ?? [];
  const availableCourses = detail?.availableCourses ?? [];

  return (
    <section
      id="admin-student-composer"
      className={cn(
        "overflow-hidden rounded-lg border bg-gradient-to-b from-primary/[0.04] to-card shadow-sm",
        isEditMode ? "border-heading/40 ring-1 ring-heading/10" : "border-primary/20",
      )}
      aria-labelledby={`${formId}-heading`}
    >
      <div className="flex flex-wrap items-start justify-between gap-1.5 border-b border-border/50 bg-card/90 px-3 py-2">
        <div>
          <h2
            id={`${formId}-heading`}
            className="flex items-center gap-1 text-xs font-bold text-heading"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            {isEditMode ? "تعديل الطالب" : "إضافة طالب جديد"}
          </h2>
          <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
            {isEditMode
              ? "عدّل البيانات وأدر التسجيلات في الكورسات من هنا."
              : "يُنشأ بحساب دور «طالب». اترك كلمة المرور فارغة للتوليد التلقائي."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted"
          aria-label="إغلاق لوحة الإضافة"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3 px-3 py-3">
        {fieldError ? (
          <div className="rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-1.5 text-[0.6875rem] text-destructive">
            {fieldError}
          </div>
        ) : null}

        {loadingDetail ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={String(i)}
                className="h-8 animate-pulse rounded-md bg-muted/40"
              />
            ))}
          </div>
        ) : null}

        {!loadingDetail ? (
          <>
            {isEditMode && detail ? (
              <p className="text-[0.625rem] text-muted-foreground">
                <span className="font-semibold text-heading">
                  {detail.student.email}
                </span>
                {" · "}
                {STATUS_LABEL[detail.student.status]}
                {detail.student.lastLoginAt
                  ? ` · آخر دخول ${new Date(detail.student.lastLoginAt).toLocaleDateString("ar-JO")}`
                  : " · لم يسجّل دخولًا بعد"}
              </p>
            ) : null}

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (isEditMode) {
                  void handleSaveProfile();
                } else {
                  void handleCreate(e);
                }
              }}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={`${formId}-name`} className="text-[0.625rem]">
                    الاسم الكامل *
                  </Label>
                  <Input
                    id={`${formId}-name`}
                    className="h-8 rounded-md px-2.5 text-[0.6875rem]"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                {!isEditMode ? (
                  <div className="space-y-1">
                    <Label htmlFor={`${formId}-email`} className="text-[0.625rem]">
                      البريد *
                    </Label>
                    <Input
                      id={`${formId}-email`}
                      dir="ltr"
                      type="email"
                      className="h-8 rounded-md px-2.5 text-left text-[0.6875rem]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                ) : null}
                <div className="space-y-1">
                  <Label htmlFor={`${formId}-status`} className="text-[0.625rem]">
                    حالة الحساب
                  </Label>
                  <select
                    id={`${formId}-status`}
                    className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-[0.6875rem]"
                    value={isEditMode ? editStatus : status}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (isEditMode) {
                        setEditStatus(v as StudentStatus);
                      } else {
                        setStatus(v as "ACTIVE" | "SUSPENDED");
                      }
                    }}
                  >
                    {isEditMode ? (
                      <>
                        <option value="ACTIVE">نشط</option>
                        <option value="SUSPENDED">موقوف</option>
                        <option value="DELETED">محذوف</option>
                      </>
                    ) : (
                      <>
                        <option value="ACTIVE">نشط</option>
                        <option value="SUSPENDED">موقوف</option>
                      </>
                    )}
                  </select>
                </div>
                <div className={cn("space-y-1", !isEditMode && "sm:col-span-2")}>
                  <Label htmlFor={`${formId}-pw`} className="text-[0.625rem]">
                    {isEditMode ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور (اختياري)"}
                  </Label>
                  <Input
                    id={`${formId}-pw`}
                    dir="ltr"
                    type="password"
                    autoComplete="new-password"
                    className="h-8 max-w-md rounded-md px-2.5 text-left text-[0.6875rem]"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      isEditMode
                        ? "اتركه فارغًا إن لم يتغيّر"
                        : "اتركه فارغًا للتوليد التلقائي"
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2">
                <Button
                  type="submit"
                  size="sm"
                  className="h-7 gap-1 rounded-full px-3 text-[0.6875rem] shadow-brand"
                  disabled={busy}
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <UserPen className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {isEditMode ? "حفظ التعديلات" : "إنشاء الطالب"}
                </Button>
              </div>
            </form>

            {isEditMode && detail ? (
              <div className="space-y-2 border-t border-border/50 pt-3">
                <h3 className="flex items-center gap-1 text-[0.6875rem] font-bold text-heading">
                  <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden />
                  التسجيلات في الكورسات
                </h3>

                {availableCourses.length > 0 ? (
                  <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/15 p-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Label
                        htmlFor={`${formId}-course`}
                        className="text-[0.625rem]"
                      >
                        إضافة كورس منشور
                      </Label>
                      <select
                        id={`${formId}-course`}
                        className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-[0.6875rem]"
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
                      size="sm"
                      className="h-7 shrink-0 rounded-full px-3 text-[0.6875rem]"
                      disabled={!enrollCourseId || enrolling}
                      onClick={() => void enroll()}
                    >
                      {enrolling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : null}
                      تسجيل في الكورس
                    </Button>
                  </div>
                ) : (
                  <p className="text-[0.625rem] text-muted-foreground">
                    لا توجد كورسات منشورة متاحة للتسجيل الإضافي.
                  </p>
                )}

                {enrollments.length === 0 ? (
                  <p className="text-[0.625rem] text-muted-foreground">
                    لا توجد تسجيلات بعد.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {enrollments.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-col gap-2 rounded-md border border-border/60 bg-card px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[0.6875rem] font-semibold text-heading">
                              {row.course.title}
                            </span>
                            <Badge
                              variant={
                                row.status === "ACTIVE"
                                  ? "success"
                                  : row.status === "COMPLETED"
                                    ? "secondary"
                                    : "muted"
                              }
                              className="text-[0.5625rem]"
                            >
                              {ENROLL_STATUS_LABEL[row.status]}
                            </Badge>
                          </div>
                          <p className="text-[0.625rem] text-muted-foreground">
                            {sourceLabel(row.source)} · {row.completedLessons}/
                            {row.totalLessons} درسًا · {row.progressPercent}%
                          </p>
                        </div>
                        {row.status === "ACTIVE" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 shrink-0 rounded-md border-red-200 px-2 text-[0.625rem] text-red-800 hover:bg-red-50"
                            disabled={busyEnrollmentId === row.id}
                            onClick={() => void revokeEnrollment(row.id)}
                          >
                            {busyEnrollmentId === row.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <ShieldOff
                                  className="me-1 h-3.5 w-3.5"
                                  aria-hidden
                                />
                                إلغاء التسجيل
                              </>
                            )}
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
