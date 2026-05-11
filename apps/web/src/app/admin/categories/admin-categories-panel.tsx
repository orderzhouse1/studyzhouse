"use client";

import { Archive, FolderTree, Loader2, Pencil, Plus, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { adminFetchJson } from "@/lib/courses-client-api";
import type {
  CategoryCreateBody,
  CategoryUpdateBody,
} from "@studyhouse/shared";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  success: true;
  data: { items: CategoryRow[] };
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type Scope = "all" | "active" | "archived";

export function AdminCategoriesPanel(): React.ReactElement {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<Scope>("all");

  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", "20");
    p.set("scope", scope);
    return p.toString();
  }, [page, scope]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<ListResponse>(
        `/admin/categories?${qs}`,
      );
      setRows(json.data.items);
      setMeta(json.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل التصنيفات.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [scope]);

  async function handleCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const body: CategoryCreateBody = {
        name: createName.trim(),
        ...(createSlug.trim() ? { slug: createSlug.trim() } : {}),
        ...(createDesc.trim() ? { description: createDesc.trim() } : {}),
      };
      await adminFetchJson(`/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setCreateName("");
      setCreateSlug("");
      setCreateDesc("");
      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الإنشاء.");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(row: CategoryRow): void {
    setEditing(row);
    setEditName(row.name);
    setEditSlug(row.slug);
    setEditDesc(row.description ?? "");
  }

  async function handleSaveEdit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    setError(null);
    try {
      const body: CategoryUpdateBody = {
        name: editName.trim(),
        slug: editSlug.trim() || undefined,
        description: editDesc.trim() === "" ? null : editDesc.trim(),
      };
      await adminFetchJson(`/admin/categories/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الحفظ.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleArchive(row: CategoryRow): Promise<void> {
    if (row.archivedAt) return;
    const ok = window.confirm(
      `أرشفة التصنيف «${row.name}»؟ لن يظهر في القوائم العامة للكورسات الجديدة.`,
    );
    if (!ok) return;
    setError(null);
    try {
      await adminFetchJson(`/admin/categories/${row.id}`, {
        method: "DELETE",
      });
      if (editing?.id === row.id) setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الأرشفة.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 bg-card/80 shadow-sm ring-1 ring-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">تصنيف جديد</CardTitle>
            <CardDescription>
              اسم واضح، ومعرّف اختياري (إنجليزي). يُولَّد تلقائيًا من الاسم عند
              الترك فارغًا.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={(e) => void handleCreate(e)}>
              <div className="space-y-2">
                <Label htmlFor="c-name">الاسم</Label>
                <Input
                  id="c-name"
                  className="rounded-xl"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-slug">المعرّف (اختياري)</Label>
                <Input
                  id="c-slug"
                  dir="ltr"
                  className="rounded-xl text-left"
                  placeholder="مثال: programming"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-desc">الوصف</Label>
                <Textarea
                  id="c-desc"
                  className="min-h-[88px] rounded-xl"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl sm:w-auto"
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden />
                )}
                إضافة التصنيف
              </Button>
            </form>
          </CardContent>
        </Card>

        {editing ? (
          <Card className="border-primary/25 bg-primary/[0.04] shadow-sm ring-1 ring-primary/15">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">تعديل التصنيف</CardTitle>
              <CardDescription>تحديث الاسم والمعرّف والوصف.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={(e) => void handleSaveEdit(e)}
              >
                <div className="space-y-2">
                  <Label htmlFor="e-name">الاسم</Label>
                  <Input
                    id="e-name"
                    className="rounded-xl"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-slug">المعرّف</Label>
                  <Input
                    id="e-slug"
                    dir="ltr"
                    className="rounded-xl text-left"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-desc">الوصف</Label>
                  <Textarea
                    id="e-desc"
                    className="min-h-[88px] rounded-xl"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl"
                    disabled={savingEdit}
                  >
                    {savingEdit ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Save className="h-4 w-4" aria-hidden />
                    )}
                    حفظ
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setEditing(null)}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-6 text-center shadow-inner">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <FolderTree className="h-6 w-6" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              اختر «تعديل» من الجدول لتظهر لوحة التحرير هنا
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              تصميم واسع يبقي التركيز على المحتوى العربي دون ازدحام.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/50 p-3 shadow-sm md:flex-row md:items-end md:justify-between md:p-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-primary">عرض القائمة</p>
          <h2 className="text-lg font-semibold tracking-tight">الجدول</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "الكل"],
              ["active", "نشط فقط"],
              ["archived", "مؤرشف فقط"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              variant={scope === key ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setScope(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
        {loading ? (
          <div className="space-y-2.5 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={String(i)}
                className="h-14 animate-pulse rounded-xl bg-muted/40"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-center md:py-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground ring-1 ring-border/70">
              <FolderTree className="h-5 w-5" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              لا توجد تصنيفات في هذا العرض
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              أضف تصنيفًا من البطاقة أعلى الصفحة أو غيّر فلتر العرض.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-secondary/40 text-right text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium md:px-5">التصنيف</th>
                  <th className="px-4 py-2.5 font-medium md:px-5">الحالة</th>
                  <th className="px-4 py-2.5 font-medium md:px-5">آخر تحديث</th>
                  <th className="px-4 py-2.5 font-medium md:px-5">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/60 transition-colors hover:bg-secondary/20"
                  >
                    <td className="px-4 py-3.5 align-top md:px-5">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          /{row.slug}
                        </p>
                        {row.description ? (
                          <p className="max-w-md pt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                            {row.description}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top md:px-5">
                      {row.archivedAt ? (
                        <Badge variant="archived">مؤرشف</Badge>
                      ) : (
                        <Badge variant="published">نشط</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top text-muted-foreground md:px-5">
                      {new Date(row.updatedAt).toLocaleString("ar")}
                    </td>
                    <td className="px-4 py-3.5 align-top md:px-5">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center gap-1 rounded-xl"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          تعديل
                        </Button>
                        {!row.archivedAt ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center gap-1 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => void handleArchive(row)}
                          >
                            <Archive className="h-3.5 w-3.5" aria-hidden />
                            أرشفة
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-sm text-muted-foreground">
          <span>
            صفحة {meta.page} من {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={meta.page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
