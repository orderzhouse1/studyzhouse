"use client";

import { EyeOff, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { CourseCardCourse } from "@/components/courses/course-card";
import { CatalogCourseCard } from "@/components/courses/catalog-course-card";
import { Button } from "@/components/ui/button";
import {
  dismissStudentRecommendation,
  fetchStudentRecommendations,
  StudentApiError,
} from "@/lib/student-recommendations-api";
import { cn } from "@/lib/utils";
import type { StudentRecommendationItem } from "@studyhouse/shared";

function toCourseCard(
  item: StudentRecommendationItem,
): CourseCardCourse {
  return {
    id: item.course.id,
    title: item.course.title,
    slug: item.course.slug,
    shortDescription: null,
    thumbnailUrl: item.course.thumbnailUrl,
    pricingType: item.course.pricingType,
    priceAmount: item.course.priceAmount,
    currency: item.course.currency,
    estimatedDurationMinutes: item.course.estimatedDurationMinutes ?? null,
    category: item.course.category,
    lessonCount: 0,
    averageRating: item.course.averageRating,
    reviewCount: item.course.reviewCount,
  };
}

function RecommendationCard({
  item,
  onDismiss,
  dismissing,
}: {
  item: StudentRecommendationItem;
  onDismiss: (courseId: string) => void;
  dismissing: boolean;
}): React.ReactElement {
  return (
    <div className="relative flex h-full flex-col">
      <p className="mb-2 line-clamp-1 text-xs font-medium text-primary">
        {item.reasonLabelAr}
      </p>
      <CatalogCourseCard
        course={toCourseCard(item)}
        detailBasePath="/student/courses"
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={dismissing}
        className="mt-2 w-full rounded-xl text-xs text-muted-foreground hover:text-heading"
        onClick={() => onDismiss(item.course.id)}
      >
        {dismissing ? (
          <Loader2 className="ms-1 h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <EyeOff className="ms-1 h-3.5 w-3.5" aria-hidden />
        )}
        إخفاء من الاقتراحات
      </Button>
    </div>
  );
}

export function StudentRecommendationsSection({
  className,
  variant = "dashboard",
  limit = 4,
  showViewAll = true,
}: {
  className?: string;
  variant?: "dashboard" | "page";
  limit?: number;
  showViewAll?: boolean;
}): React.ReactElement | null {
  const [items, setItems] = useState<StudentRecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchStudentRecommendations(limit);
      setItems(rows);
    } catch (e) {
      setError(
        e instanceof StudentApiError
          ? e.message
          : "تعذّر تحميل الاقتراحات.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDismiss(courseId: string): Promise<void> {
    setDismissingId(courseId);
    try {
      await dismissStudentRecommendation(courseId);
      setItems((prev) => prev.filter((i) => i.course.id !== courseId));
    } catch (e) {
      setError(
        e instanceof StudentApiError ? e.message : "تعذّر إخفاء الكورس.",
      );
    } finally {
      setDismissingId(null);
    }
  }

  if (loading) {
    return (
      <section className={cn("space-y-5", className)}>
        <div className="h-7 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className="aspect-[16/10] animate-pulse rounded-2xl bg-muted/60"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error && items.length === 0) {
    return (
      <section className={cn("space-y-3", className)}>
        <p className="text-sm text-red-800">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          إعادة المحاولة
        </Button>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const header =
    variant === "page" ? (
      <div>
        <h1 className="text-2xl font-bold text-heading md:text-3xl">
          مقترح لك
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          كورسات مختارة بناءً على اهتماماتك وسجلّك التعليمي — بدون ذكاء اصطناعي
          خارجي.
        </p>
      </div>
    ) : (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            مقترح لك
          </p>
          <h2 className="mt-1 text-xl font-bold text-heading md:text-2xl">
            كورسات قد تعجبك
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            بناءً على اهتماماتك، تصنيفاتك، والكورسات الأكثر تقييماً وتسجيلاً.
          </p>
        </div>
        {showViewAll ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl border-heading/15"
          >
            <Link href="/student/recommendations">عرض الكل</Link>
          </Button>
        ) : null}
      </div>
    );

  return (
    <section className={cn("space-y-5", className)} dir="rtl">
      {header}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <RecommendationCard
            key={item.course.id}
            item={item}
            dismissing={dismissingId === item.course.id}
            onDismiss={(id) => void handleDismiss(id)}
          />
        ))}
      </div>
    </section>
  );
}
