"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminApiError,
  sendAdminNotification,
} from "@/lib/admin-notifications-api";
import type { AdminSendNotificationResponse } from "@studyhouse/shared";

const TARGET_OPTIONS = [
  { value: "ALL_STUDENTS", label: "كل الطلاب" },
  { value: "COURSE", label: "طلاب كورس معيّن" },
  { value: "STUDENT", label: "طالب محدد" },
] as const;

export function AdminSendNotificationForm(): React.ReactElement {
  const [target, setTarget] = useState<(typeof TARGET_OPTIONS)[number]["value"]>("ALL_STUDENTS");
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [sendWebPush, setSendWebPush] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdminSendNotificationResponse | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const summary = await sendAdminNotification({
        target,
        courseId: target === "COURSE" ? courseId.trim() : undefined,
        studentId: target === "STUDENT" ? studentId.trim() : undefined,
        title: title.trim(),
        body: body.trim(),
        actionUrl: actionUrl.trim() || undefined,
        sendWebPush,
      });
      setResult(summary);
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "تعذّر إرسال الإشعار.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="التواصل"
        title="إرسال إشعار"
        description="إنشاء إشعار داخلي للطلاب مع خيار Web Push للمشتركين."
      />

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="target">الفئة المستهدفة</Label>
          <select
            id="target"
            value={target}
            onChange={(e) =>
              setTarget(e.target.value as (typeof TARGET_OPTIONS)[number]["value"])
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            {TARGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {target === "COURSE" ? (
          <div className="space-y-2">
            <Label htmlFor="courseId">معرّف الكورس (courseId)</Label>
            <Input
              id="courseId"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="cuid..."
              className="rounded-xl"
              dir="ltr"
            />
          </div>
        ) : null}

        {target === "STUDENT" ? (
          <div className="space-y-2">
            <Label htmlFor="studentId">معرّف الطالب (studentId)</Label>
            <Input
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="cuid..."
              className="rounded-xl"
              dir="ltr"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="title">العنوان</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">النص</Label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            required
            rows={4}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actionUrl">رابط الإجراء (اختياري)</Label>
          <Input
            id="actionUrl"
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            placeholder="/student/notifications"
            className="rounded-xl"
            dir="ltr"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendWebPush}
            onChange={(e) => setSendWebPush(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          إرسال Web Push للطلاب المفعّلين
        </label>

        {error ? <p className="text-sm text-red-800">{error}</p> : null}

        {result ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
            <p>تم الإرسال بنجاح.</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>مستهدفون: {result.totalTargeted}</li>
              <li>إشعارات داخلية: {result.notificationsCreated}</li>
              <li>Web Push ناجح: {result.webPushSent}</li>
              <li>Web Push فاشل: {result.webPushFailed}</li>
              <li>اشتراكات معطّلة: {result.inactiveSubscriptionsDisabled}</li>
            </ul>
          </div>
        ) : null}

        <Button type="submit" disabled={busy} className="rounded-xl">
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
          إرسال الإشعار
        </Button>
      </form>
    </div>
  );
}
