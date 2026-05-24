"use client";

import { Copy, Loader2, Upload, Wallet, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { PublicCourseDetail } from "@/components/courses/course-public-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  StudentApiError,
  invalidateStudentDataCache,
  studentFetchJson,
  studentFetchJsonCached,
} from "@/lib/student-client-api";

type PaymentInfoResponse = {
  success: true;
  data: { cliqAlias: string; cliqInstructions: string };
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("read_failed"));
    };
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

export function CliqPaymentDialog({
  open,
  onOpenChange,
  course,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: PublicCourseDetail;
  onSubmitted: () => void;
}): React.ReactElement | null {
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [info, setInfo] = useState<PaymentInfoResponse["data"] | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadInfo = useCallback(async (): Promise<void> => {
    setInfoLoading(true);
    try {
      const json = await studentFetchJsonCached<PaymentInfoResponse>(
        "/student/payment-info",
      );
      setInfo(json.data);
    } catch {
      setInfo({ cliqAlias: "", cliqInstructions: "" });
    } finally {
      setInfoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadInfo();
      setError(null);
    } else {
      setPaymentReference("");
      setTransferNote("");
      setProofFile(null);
      setProofPreview(null);
      setCopied(false);
    }
  }, [open, loadInfo]);

  function pickFile(file: File | null): void {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار صورة (JPG أو PNG أو WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت.");
      return;
    }
    setError(null);
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function copyAlias(): Promise<void> {
    if (!info?.cliqAlias) return;
    try {
      await navigator.clipboard.writeText(info.cliqAlias);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    const ref = paymentReference.trim();
    const note = transferNote.trim();
    if (ref.length < 4 && note.length < 8 && !proofFile) {
      setError("أدخل رقم العملية، أو اكتب تفاصيل الحوالة، أو أرفق صورة الإيصال.");
      return;
    }

    setSubmitting(true);
    try {
      let proofImageBase64: string | undefined;
      if (proofFile) {
        proofImageBase64 = await fileToDataUrl(proofFile);
      }

      await studentFetchJson<{ success: true }>("/student/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          paidAmount: course.priceAmount ?? "0",
          paymentReference: ref.length >= 4 ? ref : undefined,
          note: note.length > 0 ? note : undefined,
          proofImageBase64,
        }),
      });

      invalidateStudentDataCache();
      onSubmitted();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof StudentApiError
          ? err.message
          : "تعذّر إرسال طلب التفعيل.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[hsl(222_47%_10%_/_0.55)] backdrop-blur-sm"
        aria-label="إغلاق"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_24px_64px_-16px_hsl(222_47%_10%_/_0.35)] ring-1 ring-primary/20"
      >
        <div className="border-b border-border/70 bg-gradient-to-l from-primary/10 via-secondary/30 to-card px-5 py-3 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-brand">
                <Wallet className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 id={titleId} className="text-base font-bold text-heading">
                  تفعيل عبر CliQ
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                  {course.title}
                  {course.priceAmount ? (
                    <span dir="ltr" className="ms-2 font-semibold text-primary">
                      {course.priceAmount} {course.currency}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
              onClick={() => onOpenChange(false)}
              aria-label="إغلاق النافذة"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="max-h-[min(70vh,28rem)] space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="rounded-xl border border-cyan-200/70 bg-cyan-50/90 px-3 py-2 text-xs text-cyan-950">
            <p className="font-semibold">معرّف التحويل (CliQ)</p>
            {infoLoading ? (
              <p className="mt-1 text-xs text-cyan-900/80">جاري التحميل…</p>
            ) : info?.cliqAlias ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code
                  dir="ltr"
                  className="rounded-md bg-white/80 px-2.5 py-1 text-sm font-bold tracking-wide text-heading"
                >
                  {info.cliqAlias}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-cyan-300/80 bg-white/60"
                  onClick={() => void copyAlias()}
                >
                  <Copy className="ms-1.5 h-3.5 w-3.5" aria-hidden />
                  {copied ? "تم النسخ" : "نسخ"}
                </Button>
              </div>
            ) : (
              <p className="mt-1 text-xs text-cyan-900/85">
                لم يُضبط معرّف CliQ بعد — تواصل مع الدعم أو راجع تعليمات المنصّة.
              </p>
            )}
            {info?.cliqInstructions ? (
              <p className="mt-2 text-xs leading-relaxed text-cyan-900/90 whitespace-pre-wrap">
                {info.cliqInstructions}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliq-ref" className="text-xs">
              رقم العملية / المرجع
            </Label>
            <Input
              id="cliq-ref"
              dir="ltr"
              className="h-9 rounded-lg text-sm"
              placeholder="مثال: CLIQ-123456"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliq-note" className="text-xs">
              تفاصيل الحوالة (نص)
            </Label>
            <Textarea
              id="cliq-note"
              rows={2}
              className="min-h-0 resize-none rounded-lg py-2 text-sm"
              placeholder="اكتب تفاصيل التحويل إن لم يكن لديك رقم مرجع…"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">صورة إيصال الحوالة</Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                pickFile(f ?? null);
              }}
              className={cn(
                "relative flex min-h-[4.25rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-3 py-2.5 text-center transition-colors",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border/80 bg-muted/25 hover:border-primary/40 hover:bg-muted/40",
              )}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              {proofPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proofPreview}
                  alt="معاينة الإيصال"
                  className="max-h-16 rounded-md object-contain"
                />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-primary/70" aria-hidden />
                  <p className="text-xs font-medium text-heading">
                    اسحب الصورة أو اضغط للاختيار
                  </p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    JPG, PNG, WebP — حتى 5 ميجابايت
                  </p>
                </>
              )}
            </div>
            {proofFile ? (
              <p className="text-xs text-muted-foreground">{proofFile.name}</p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <p className="text-center text-[0.65rem] text-muted-foreground">
            <Link
              href="/refund-policy"
              className="font-medium text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              اطلع على سياسة الاسترجاع
            </Link>
          </p>

          <Button
            type="submit"
            disabled={submitting}
            className="h-9 w-full rounded-lg text-sm shadow-brand"
          >
            {submitting ? (
              <Loader2 className="ms-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            إرسال طلب التفعيل
          </Button>
        </form>
      </div>
    </div>
  );
}
