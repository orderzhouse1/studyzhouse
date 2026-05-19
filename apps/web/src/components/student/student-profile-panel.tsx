"use client";

import { Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

import { StudentAccountPageHeader } from "@/components/student/student-account-page-header";
import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeCountryForSelect } from "@/lib/countries";
import {
  fetchStudentProfilePage,
  patchStudentProfile,
} from "@/lib/student-profile-api";
import { StudentApiError } from "@/lib/student-client-api";
import { cn } from "@/lib/utils";
import type {
  StudentInterestId,
  StudentLearningGoalId,
  StudentProfilePage,
} from "@studyhouse/shared";
import {
  PREFERRED_LEARNING_STYLE_OPTIONS,
  STUDENT_GENDER_OPTIONS,
  STUDENT_INTEREST_OPTIONS,
  STUDENT_LEARNING_GOAL_OPTIONS,
  STUDENT_LEVEL_OPTIONS,
  WEEKLY_STUDY_TIME_OPTIONS,
} from "@studyhouse/shared";

function toggleInList<T extends string>(list: T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (list.length >= max) return list;
  return [...list, value];
}

export function StudentProfilePanel(): React.ReactElement {
  const formId = useId();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<
    StudentProfilePage["profile"]["gender"] | ""
  >("");
  const [currentLevel, setCurrentLevel] = useState<
    StudentProfilePage["profile"]["currentLevel"] | ""
  >("");
  const [interests, setInterests] = useState<StudentInterestId[]>([]);
  const [learningGoals, setLearningGoals] = useState<StudentLearningGoalId[]>(
    [],
  );
  const [weeklyStudyTime, setWeeklyStudyTime] = useState("");
  const [preferredLearningStyle, setPreferredLearningStyle] = useState("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const page = await fetchStudentProfilePage();
      setEmail(page.account.email);
      setFullName(page.account.fullName);
      setCountry(normalizeCountryForSelect(page.profile.country));
      setPhone(page.profile.phone ?? "");
      setGender(page.profile.gender ?? "");
      setCurrentLevel(page.profile.currentLevel ?? "");
      setInterests(page.profile.interests);
      setLearningGoals(page.profile.learningGoals);
      setWeeklyStudyTime(page.profile.weeklyStudyTime ?? "");
      setPreferredLearningStyle(page.profile.preferredLearningStyle ?? "");
    } catch {
      setError("تعذّر تحميل الملف الشخصي.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const body: Record<string, unknown> = {
        fullName: fullName.trim(),
      };
      if (country.trim()) body.country = country.trim();
      else body.country = null;
      if (phone.trim()) body.phone = phone.trim();
      else body.phone = null;
      if (gender) body.gender = gender;
      else body.gender = null;
      if (currentLevel) body.currentLevel = currentLevel;
      else body.currentLevel = null;
      if (interests.length) body.interests = interests;
      if (learningGoals.length) body.learningGoals = learningGoals;
      if (weeklyStudyTime) body.weeklyStudyTime = weeklyStudyTime;
      else body.weeklyStudyTime = null;
      if (preferredLearningStyle) {
        body.preferredLearningStyle = preferredLearningStyle;
      } else body.preferredLearningStyle = null;

      await patchStudentProfile(body);
      setSuccess("تم حفظ التغييرات بنجاح.");
    } catch (err) {
      setError(
        err instanceof StudentApiError
          ? err.message
          : "تعذّر حفظ الملف الشخصي.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StudentAccountPageHeader
        eyebrow="حسابي"
        title="الملف الشخصي"
        description="حدّث معلوماتك لتخصيص تجربتك التعليمية. بريدك الإلكتروني للقراءة فقط حاليًا."
      />
      <div className={cn("pb-16", STUDENT_CONTENT_PAD)}>
        <div className="mx-auto w-full max-w-2xl py-6 md:py-8">
          {loading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            </div>
          ) : (
            <form
              id={formId}
              onSubmit={(e) => void onSubmit(e)}
              className="space-y-6 rounded-2xl border border-border/70 bg-card p-4 shadow-sm ring-1 ring-border/50 sm:p-6"
            >
              {error ? (
                <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                  {success}
                </div>
              ) : null}

              <section className="space-y-3">
                <h2 className="text-sm font-bold text-heading">المعلومات الأساسية</h2>
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-name`}>الاسم الكامل</Label>
                  <Input
                    id={`${formId}-name`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-email`}>البريد الإلكتروني</Label>
                  <Input
                    id={`${formId}-email`}
                    value={email}
                    readOnly
                    dir="ltr"
                    className="bg-muted/40 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    تغيير البريد غير متاح حاليًا.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${formId}-country`}>الدولة (اختياري)</Label>
                    <CountrySelect
                      id={`${formId}-country`}
                      value={country}
                      onChange={setCountry}
                      disabled={busy}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${formId}-phone`}>الهاتف (اختياري)</Label>
                    <Input
                      id={`${formId}-phone`}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">الجنس (اختياري)</Label>
                  <div className="flex flex-wrap gap-2">
                    {STUDENT_GENDER_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setGender((g) => (g === opt.id ? "" : opt.id))
                        }
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                          gender === opt.id
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/70 bg-muted/20 text-muted-foreground",
                        )}
                      >
                        {opt.labelAr}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="space-y-3 border-t border-border/60 pt-4">
                <h2 className="text-sm font-bold text-heading">التفضيلات التعليمية</h2>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">المستوى الحالي</Label>
                  <div className="flex flex-wrap gap-2">
                    {STUDENT_LEVEL_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setCurrentLevel((l) => (l === opt.id ? "" : opt.id))
                        }
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                          currentLevel === opt.id
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/70 bg-muted/20 text-muted-foreground",
                        )}
                      >
                        {opt.labelAr}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">الاهتمامات</Label>
                  <div className="flex flex-wrap gap-2">
                    {STUDENT_INTEREST_OPTIONS.map((opt) => {
                      const active = interests.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setInterests((prev) =>
                              toggleInList(prev, opt.id, 10),
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            active
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-border/70 bg-muted/20 text-muted-foreground",
                          )}
                        >
                          {opt.labelAr}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">أهداف التعلّم</Label>
                  <div className="flex flex-wrap gap-2">
                    {STUDENT_LEARNING_GOAL_OPTIONS.map((opt) => {
                      const active = learningGoals.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setLearningGoals((prev) =>
                              toggleInList(prev, opt.id, 5),
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            active
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-border/70 bg-muted/20 text-muted-foreground",
                          )}
                        >
                          {opt.labelAr}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${formId}-weekly`}>وقت الدراسة الأسبوعي</Label>
                    <select
                      id={`${formId}-weekly`}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                      value={weeklyStudyTime}
                      onChange={(e) =>
                        setWeeklyStudyTime(
                          e.target.value as typeof weeklyStudyTime,
                        )
                      }
                    >
                      <option value="">—</option>
                      {WEEKLY_STUDY_TIME_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.labelAr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${formId}-style`}>أسلوب التعلّم المفضّل</Label>
                    <select
                      id={`${formId}-style`}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                      value={preferredLearningStyle}
                      onChange={(e) =>
                        setPreferredLearningStyle(
                          e.target.value as typeof preferredLearningStyle,
                        )
                      }
                    >
                      <option value="">—</option>
                      {PREFERRED_LEARNING_STYLE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.labelAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <Button type="submit" disabled={busy} className="w-full sm:w-auto">
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" aria-hidden />
                )}
                حفظ التغييرات
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
