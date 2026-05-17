"use client";

import { FolderTree, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";
import type { CategoryCreateBody, CategoryUpdateBody } from "@studyhouse/shared";

export type CategoryComposerRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  archivedAt: string | null;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
};

const EMPTY: FormState = { name: "", slug: "", description: "" };

export function AdminCategoryComposer({
  editCategory = null,
  onCancel,
  onSaved,
  onStartNew,
}: {
  editCategory?: CategoryComposerRow | null;
  onCancel: () => void;
  onSaved: () => void;
  onStartNew?: () => void;
}): React.ReactElement {
  const isEditMode = Boolean(editCategory);
  const formId = useId();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);

  useEffect(() => {
    if (editCategory) {
      setForm({
        name: editCategory.name,
        slug: editCategory.slug,
        description: editCategory.description ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setFieldError(null);
    setSavedName(null);
  }, [editCategory]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFieldError(null);

    const name = form.name.trim();
    if (name.length < 2) {
      setFieldError("اسم التصنيف مطلوب (حرفان على الأقل).");
      return;
    }

    setBusy(true);
    try {
      if (isEditMode && editCategory) {
        const body: CategoryUpdateBody = {
          name,
          slug: form.slug.trim() || undefined,
          description: form.description.trim() === "" ? null : form.description.trim(),
        };
        await adminFetchJson(`/admin/categories/${editCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setSavedName(name);
      } else {
        const body: CategoryCreateBody = {
          name,
          ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
          ...(form.description.trim()
            ? { description: form.description.trim() }
            : {}),
        };
        await adminFetchJson(`/admin/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setSavedName(name);
      }
      onSaved();
    } catch (err) {
      setFieldError(
        err instanceof AdminApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : isEditMode
              ? "تعذّر حفظ التعديلات."
              : "تعذّر إضافة التصنيف.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (savedName) {
    return (
      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-3 text-center shadow-sm">
        <p className="text-xs font-bold text-emerald-900">
          {isEditMode ? "تم حفظ التعديلات بنجاح" : "تمت إضافة التصنيف بنجاح"}
        </p>
        <p className="mt-0.5 text-[0.6875rem] text-emerald-800/90">
          «{savedName}» {isEditMode ? "محدّث في القائمة." : "يظهر الآن في الجدول."}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2.5 h-7 rounded-full px-3 text-[0.6875rem]"
          onClick={() => {
            setForm(EMPTY);
            setSavedName(null);
            onStartNew?.();
          }}
        >
          {isEditMode ? "العودة للقائمة" : "إضافة تصنيف آخر"}
        </Button>
      </div>
    );
  }

  return (
    <section
      id="admin-category-composer"
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
            {isEditMode ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
          </h2>
          <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
            {isEditMode
              ? "عدّل الاسم والمعرّف والوصف ثم احفظ التعديلات."
              : "اسم واضح — يُولَّد المعرّف تلقائيًا عند تركه فارغًا."}
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

      <form className="space-y-3 px-3 py-3" onSubmit={(e) => void handleSubmit(e)}>
        {fieldError ? (
          <div className="rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-1.5 text-[0.6875rem] text-destructive">
            {fieldError}
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`${formId}-name`} className="text-[0.625rem]">
              الاسم *
            </Label>
            <Input
              id={`${formId}-name`}
              className="h-8 rounded-md px-2.5 text-[0.6875rem]"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${formId}-slug`} className="text-[0.625rem]">
              المعرّف (اختياري)
            </Label>
            <Input
              id={`${formId}-slug`}
              dir="ltr"
              className="h-8 rounded-md px-2.5 text-left text-[0.6875rem]"
              placeholder="programming"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`${formId}-desc`} className="text-[0.625rem]">
              الوصف
            </Label>
            <Textarea
              id={`${formId}-desc`}
              className="min-h-[56px] rounded-md px-2.5 py-1.5 text-[0.6875rem]"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2">
          <Button
            type="submit"
            size="sm"
            className="h-7 gap-1 rounded-full px-3 text-[0.6875rem] shadow-brand"
            disabled={busy || (isEditMode && Boolean(editCategory?.archivedAt))}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <FolderTree className="h-3.5 w-3.5" aria-hidden />
            )}
            {isEditMode ? "حفظ التعديلات" : "إضافة التصنيف"}
          </Button>
          {isEditMode && editCategory?.archivedAt ? (
            <p className="text-[0.625rem] text-muted-foreground">
              التصنيف مؤرشف — لا يمكن تعديله.
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
