"use client";

import { Loader2, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CourseRatingSummary } from "@/components/courses/course-rating-summary";
import {
  deleteCourseReview,
  fetchMyCourseReview,
  fetchPublicCourseReviews,
  submitCourseReview,
  updateCourseReview,
} from "@/lib/course-reviews-api";
import type {
  PublicCourseReviewItem,
  StudentCourseReviewItem,
} from "@studyhouse/shared";

const STATUS_AR: Record<string, string> = {
  PENDING: "قيد المراجعة",
  PUBLISHED: "منشور",
  HIDDEN: "مخفي",
};

export function CourseReviewsSection({
  slug,
  isStudentEnrolled = false,
}: {
  slug: string;
  isStudentEnrolled?: boolean;
}): React.ReactElement {
  const [items, setItems] = useState<PublicCourseReviewItem[]>([]);
  const [summary, setSummary] = useState<{
    averageRating: number | null;
    reviewCount: number;
  }>({ averageRating: null, reviewCount: 0 });
  const [myReview, setMyReview] = useState<StudentCourseReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const pub = await fetchPublicCourseReviews(slug);
      setItems(pub.items);
      setSummary(pub.ratingSummary);
      if (isStudentEnrolled) {
        try {
          const mine = await fetchMyCourseReview(slug);
          setMyReview(mine);
          if (mine) {
            setRating(mine.rating);
            setTitle(mine.title ?? "");
            setComment(mine.comment ?? "");
          }
        } catch {
          setMyReview(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل المراجعات.");
    } finally {
      setLoading(false);
    }
  }, [slug, isStudentEnrolled]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      if (myReview) {
        await updateCourseReview(myReview.id, {
          rating,
          title: title.trim() || null,
          comment: comment.trim() || null,
        });
      } else {
        await submitCourseReview(slug, {
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        });
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر حفظ التقييم.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!myReview) return;
    setBusy(true);
    try {
      await deleteCourseReview(myReview.id);
      setMyReview(null);
      setTitle("");
      setComment("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحذف.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-heading">مراجعات الطلاب</h2>
        <CourseRatingSummary
          className="mt-2"
          averageRating={summary.averageRating}
          reviewCount={summary.reviewCount}
        />
      </div>

      {isStudentEnrolled ? (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <h3 className="text-sm font-bold text-heading">
            {myReview ? "تعديل تقييمك" : "أضف تقييمك"}
          </h3>
          {myReview ? (
            <p className="text-xs text-muted-foreground">
              الحالة: {STATUS_AR[myReview.status] ?? myReview.status}
              {myReview.status === "PENDING"
                ? " — سيظهر للعامة بعد موافقة الإدارة."
                : null}
            </p>
          ) : null}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="rounded p-1"
                onClick={() => setRating(n)}
                aria-label={`${n} نجوم`}
              >
                <Star
                  className={
                    n <= rating
                      ? "h-6 w-6 fill-amber-400 text-amber-400"
                      : "h-6 w-6 text-muted-foreground/40"
                  }
                />
              </button>
            ))}
          </div>
          <Input
            placeholder="عنوان اختياري"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
          />
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
            placeholder="تعليقك (اختياري)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={busy}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={() => void handleSubmit()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ التقييم"}
            </Button>
            {myReview ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void handleDelete()}
              >
                حذف
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-800">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد مراجعات منشورة بعد.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-border/60 bg-background/80 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-heading">{r.student.fullName}</span>
                <span className="inline-flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {r.rating}
                </span>
              </div>
              {r.title ? (
                <p className="mt-1 text-sm font-medium text-foreground">{r.title}</p>
              ) : null}
              {r.comment ? (
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
