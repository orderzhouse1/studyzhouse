"use client";

import { ArrowLeft, Lock, Ticket } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExploreCoursesSkeleton } from "@/components/student/student-page-skeletons";
import {
  StudentApiError,
  studentFetchJsonCached,
} from "@/lib/student-client-api";

type PublicCoursesResponse = {
  success: true;
  data: {
    items: Array<{
      id: string;
      title: string;
      slug: string;
      thumbnailUrl: string | null;
      pricingType: "FREE" | "PAID";
      priceAmount: string | null;
      currency: string;
      category: null | { name: string };
      lessonCount: number;
    }>;
  };
};

type MyCoursesResponse = {
  success: true;
  data: {
    items: Array<{ course: { slug: string } }>;
  };
};

export function ExploreCoursesPanel(): React.ReactElement {
  const [items, setItems] = useState<PublicCoursesResponse["data"]["items"]>(
    [],
  );
  const [enrolledSlugs, setEnrolledSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [pub, mine] = await Promise.all([
        studentFetchJsonCached<PublicCoursesResponse>(
          "/courses?page=1&pageSize=48",
        ),
        studentFetchJsonCached<MyCoursesResponse>("/student/my-courses").catch(
          () =>
            ({
              success: true as const,
              data: { items: [] },
            }) satisfies MyCoursesResponse,
        ),
      ]);
      setItems(pub.data.items);
      setEnrolledSlugs(
        new Set(mine.data.items.map((i) => i.course.slug)),
      );
    } catch (e) {
      setError(
        e instanceof StudentApiError ? e.message : "تعذّر تحميل الكورسات.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && items.length === 0 && !error) {
    return <ExploreCoursesSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-6 text-center text-sm text-red-900">
        {error}
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={() => void load()}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">استكشف الكورسات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          كورسات منشورة على المنصة — التسجيل والدفع يُفعَّلان لاحقًا.
        </p>
      </div>
      <Card className="rounded-2xl border border-cyan-200/80 bg-cyan-50/90 shadow-none ring-1 ring-cyan-200/60">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <Ticket className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-cyan-950">
                لديك كود تفعيل؟
              </p>
              <p className="mt-0.5 text-xs text-cyan-900/80">
                أدخل الكود للحصول على وصول للكورس دون الحاجة للدفع الآن.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/student/redeem">تفعيل كورس</Link>
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => {
          const isEnrolled = enrolledSlugs.has(c.slug);
          return (
            <Card
              key={c.slug}
              className="flex flex-col overflow-hidden rounded-3xl border-border shadow-card ring-1 ring-border/60"
            >
              <div className="aspect-[16/9] w-full bg-gradient-to-br from-secondary/45 to-muted">
                {c.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    بدون صورة غلاف
                  </div>
                )}
              </div>
              <CardHeader className="space-y-1 pb-2">
                <p className="text-xs font-medium text-primary">
                  {c.category?.name ?? "عام"}
                </p>
                <CardTitle className="text-base leading-snug">{c.title}</CardTitle>
                <CardDescription>{c.lessonCount} درسًا تقريبًا</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-3 pt-0">
                {isEnrolled ? (
                  <Button
                    asChild
                    className="rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary-hover"
                  >
                    <Link href={`/learn/${c.slug}`}>
                      أكمل التعلّم
                      <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                ) : c.pricingType === "PAID" ? (
                  <div className="space-y-2">
                    <Button
                      asChild
                      className="w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <Link href={`/student/payments?courseId=${c.id}`}>
                        طلب تفعيل عبر CliQ
                      </Link>
                    </Button>
                    <div className="flex items-start gap-2 rounded-xl border border-cyan-200/70 bg-cyan-50/80 px-3 py-2 text-xs text-cyan-950">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" aria-hidden />
                      <span>
                        ادفع عبر CliQ خارج المنصة ثم أرسل رقم العملية من صفحة{" "}
                        <Link
                          href="/student/payments"
                          className="font-semibold underline underline-offset-2"
                        >
                          مدفوعاتي
                        </Link>
                        .
                        {c.priceAmount ? (
                          <span dir="ltr" className="mt-1 block font-mono text-[11px] text-cyan-900/90">
                            سعر الكورس: {c.priceAmount} {c.currency}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      كورس مجاني — إتمام التسجيل من داخل المنصة سيُفعَّل لاحقًا.
                    </p>
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href={`/courses/${c.slug}`}>صفحة الكورس العامة</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
