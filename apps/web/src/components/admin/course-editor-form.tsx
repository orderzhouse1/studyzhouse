"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";
import { adminFetchJson } from "@/lib/courses-client-api";
import {
  courseCreateBodySchema,
  courseUpdateBodySchema,
  type CourseCreateBody,
  type CourseUpdateBody,
} from "@studyhouse/shared";

type CategoryOption = { id: string; name: string; slug: string };

/** حقول موحّدة لإنشاء/تعديل الكورس — يوفّر توافقًا مع كلا مخطّطَي Zod */
type CourseEditorFormValues = {
  title: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  categoryId: string | null;
  pricingType: "FREE" | "PAID";
  priceAmount?: number;
  currency: string;
  level: CourseCreateBody["level"];
  estimatedDurationMinutes?: number;
  status: CourseCreateBody["status"];
};

type AdminCoursePayload = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  pricingType: "FREE" | "PAID";
  priceAmount: string | null;
  currency: string;
  level: CourseCreateBody["level"];
  estimatedDurationMinutes: number | null;
  status: CourseCreateBody["status"];
  category: null | { id: string; name: string; slug: string };
};

export function CourseEditorForm({
  mode,
  courseId,
  initial,
}: {
  mode: "create" | "edit";
  courseId?: string;
  initial?: AdminCoursePayload;
}): React.ReactElement {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(
    () => (mode === "create" ? courseCreateBodySchema : courseUpdateBodySchema),
    [mode],
  );

  const emptyCreate = useMemo(
    (): CourseEditorFormValues => ({
      title: "",
      slug: "",
      description: "",
      shortDescription: "",
      thumbnailUrl: "",
      categoryId: null,
      pricingType: "FREE",
      priceAmount: undefined,
      currency: "JOD",
      level: "ALL_LEVELS",
      estimatedDurationMinutes: undefined,
      status: "DRAFT",
    }),
    [],
  );

  const editPlaceholder = useMemo(
    (): CourseEditorFormValues => ({ ...emptyCreate }),
    [emptyCreate],
  );

  const valuesFromInitial = useMemo((): CourseEditorFormValues | null => {
    if (!initial) return null;
    return {
      title: initial.title,
      slug: initial.slug,
      description: initial.description,
      shortDescription: initial.shortDescription ?? "",
      thumbnailUrl: initial.thumbnailUrl ?? "",
      categoryId: initial.category?.id ?? null,
      pricingType: initial.pricingType,
      priceAmount: initial.priceAmount ? Number(initial.priceAmount) : undefined,
      currency: initial.currency,
      level: initial.level,
      estimatedDurationMinutes: initial.estimatedDurationMinutes ?? undefined,
      status: initial.status,
    };
  }, [initial]);

  const form = useForm<CourseEditorFormValues>({
    resolver: zodResolver(schema) as Resolver<CourseEditorFormValues>,
    defaultValues:
      mode === "create"
        ? emptyCreate
        : (valuesFromInitial ?? editPlaceholder),
  });

  useEffect(() => {
    if (mode === "edit" && valuesFromInitial) {
      form.reset(valuesFromInitial);
    }
  }, [form, mode, valuesFromInitial]);

  const pricingType = form.watch("pricingType") as CourseCreateBody["pricingType"];

  useEffect(() => {
    let cancelled = false;
    async function loadCategories(): Promise<void> {
      try {
        const json = await adminFetchJson<{
          success: true;
          data: { items: CategoryOption[] };
        }>(`/categories?page=1&pageSize=100`);
        if (!cancelled) {
          setCategories(json.data.items);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCats(false);
        }
      }
    }
    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(
    values: CourseCreateBody | CourseUpdateBody,
  ): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      if (mode === "create") {
        const body = values as CourseCreateBody;
        const payload = {
          ...body,
          thumbnailUrl: body.thumbnailUrl && body.thumbnailUrl.length > 0 ? body.thumbnailUrl : "",
          categoryId: body.categoryId ?? null,
          priceAmount:
            body.pricingType === "PAID" ? body.priceAmount : undefined,
        };

        const json = await adminFetchJson<{
          success: true;
          data: { course: { id: string } };
        }>(`/admin/courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        router.replace(`/admin/courses/${json.data.course.id}`);
        router.refresh();
        return;
      }

      if (!courseId) {
        throw new Error("معرّف الكورس غير متوفر.");
      }

      const body = values as CourseUpdateBody;
      const payload: CourseUpdateBody = {
        ...body,
        thumbnailUrl:
          body.thumbnailUrl === undefined
            ? undefined
            : body.thumbnailUrl && body.thumbnailUrl.length > 0
              ? body.thumbnailUrl
              : "",
        categoryId: body.categoryId ?? null,
        priceAmount:
          body.pricingType === "PAID" ? body.priceAmount ?? undefined : null,
      };

      await adminFetchJson(`/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="space-y-8"
      onSubmit={form.handleSubmit((vals: CourseEditorFormValues) =>
        void onSubmit(vals as CourseCreateBody | CourseUpdateBody),
      )}
      noValidate
    >
      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>محتوى الكورس</CardTitle>
            <CardDescription>
              اكتب بوضوح وبمساحات بصرية راقية — الوصف الطويل للصفحة العامة، والوصف
              القصير للبطاقات.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">العنوان</Label>
              <Input id="title" {...form.register("title")} className="rounded-xl" />
              {form.formState.errors.title?.message ? (
                <p className="text-xs text-destructive">
                  {String(form.formState.errors.title.message)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">المعرّف (اختياري)</Label>
              <Input
                id="slug"
                dir="ltr"
                className="rounded-xl text-left"
                placeholder="يُولَّد تلقائيًا من العنوان إن تُرك فارغًا عند الإنشاء"
                {...form.register("slug")}
              />
              {form.formState.errors.slug?.message ? (
                <p className="text-xs text-destructive">
                  {String(form.formState.errors.slug.message)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">وصف قصير</Label>
              <Textarea
                id="shortDescription"
                className="rounded-xl"
                {...form.register("shortDescription")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف الكامل</Label>
              <Textarea
                id="description"
                className="min-h-[180px] rounded-xl"
                {...form.register("description")}
              />
              {form.formState.errors.description?.message ? (
                <p className="text-xs text-destructive">
                  {String(form.formState.errors.description.message)}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>الأصول والتصنيف</CardTitle>
              <CardDescription>صورة الغلاف رابطًا، والتصنيف من القائمة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">رابط صورة الغلاف</Label>
                <Input
                  id="thumbnailUrl"
                  dir="ltr"
                  className="rounded-xl text-left"
                  placeholder="https://"
                  {...form.register("thumbnailUrl")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">التصنيف</Label>
                <select
                  id="categoryId"
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={loadingCats}
                  {...form.register("categoryId", {
                    setValueAs: (v: string) => (v === "" ? null : v),
                  })}
                >
                  <option value="">بدون تصنيف</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>التسعير والمستوى</CardTitle>
              <CardDescription>اختيارات هادئة وواضحة دون ازدحام.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pricingType">نوع التسعير</Label>
                  <select
                    id="pricingType"
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm"
                    {...form.register("pricingType")}
                  >
                    <option value="FREE">مجاني</option>
                    <option value="PAID">مدفوع</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">العملة</Label>
                  <Input
                    id="currency"
                    dir="ltr"
                    className="rounded-xl text-left"
                    {...form.register("currency")}
                  />
                </div>
              </div>

              {pricingType === "PAID" ? (
                <div className="space-y-2">
                  <Label htmlFor="priceAmount">المبلغ</Label>
                  <Input
                    id="priceAmount"
                    type="number"
                    step="0.01"
                    dir="ltr"
                    className="rounded-xl text-left"
                    {...form.register("priceAmount", { valueAsNumber: true })}
                  />
                  {form.formState.errors.priceAmount?.message ? (
                    <p className="text-xs text-destructive">
                      {String(form.formState.errors.priceAmount.message)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="level">المستوى</Label>
                  <select
                    id="level"
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm"
                    {...form.register("level")}
                  >
                    <option value="BEGINNER">مبتدئ</option>
                    <option value="INTERMEDIATE">متوسط</option>
                    <option value="ADVANCED">متقدم</option>
                    <option value="ALL_LEVELS">جميع المستويات</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDurationMinutes">مدة تقديرية (دقيقة)</Label>
                  <Input
                    id="estimatedDurationMinutes"
                    type="number"
                    dir="ltr"
                    className="rounded-xl text-left"
                    {...form.register("estimatedDurationMinutes", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <select
                  id="status"
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm"
                  {...form.register("status")}
                >
                  <option value="DRAFT">مسودة</option>
                  <option value="PUBLISHED">منشور</option>
                  <option value="ARCHIVED">مؤرشف</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border/70 pt-6 md:flex-row md:items-center md:justify-between">
        <Button
          type="submit"
          className="rounded-xl px-8 py-6 text-base"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              جارٍ الحفظ…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden />
              {mode === "create" ? "إنشاء الكورس" : "حفظ التعديلات"}
            </>
          )}
        </Button>

        <Button asChild type="button" variant="outline" className="rounded-xl">
          <Link href="/admin/courses">العودة للقائمة</Link>
        </Button>
      </div>
    </form>
  );
}
