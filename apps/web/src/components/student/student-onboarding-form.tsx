"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeCountryForSelect } from "@/lib/countries";
import {
  completeStudentOnboarding,
  fetchStudentProfile,
  skipStudentOnboarding,
} from "@/lib/student-profile-api";
import { StudentApiError } from "@/lib/student-client-api";
import { cn } from "@/lib/utils";
import type { StudentOnboardingCompleteBody } from "@studyhouse/shared";
import type {
  StudentInterestId,
  StudentLearningGoalId,
} from "@studyhouse/shared";
import {
  PREFERRED_LEARNING_STYLE_OPTIONS,
  STUDENT_GENDER_OPTIONS,
  STUDENT_INTEREST_OPTIONS,
  STUDENT_LEARNING_GOAL_OPTIONS,
  STUDENT_LEVEL_OPTIONS,
  WEEKLY_STUDY_TIME_OPTIONS,
} from "@studyhouse/shared";

const STEPS = [
  { id: 1, title: "اهتماماتك" },
  { id: 2, title: "أهدافك ومستواك" },
  { id: 3, title: "معلومات اختيارية" },
] as const;

function toggleInList<T extends string>(list: T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (list.length >= max) return list;
  return [...list, value];
}

export function StudentOnboardingForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = useId();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [interests, setInterests] = useState<StudentInterestId[]>([]);
  const [learningGoals, setLearningGoals] = useState<StudentLearningGoalId[]>(
    [],
  );
  const [currentLevel, setCurrentLevel] = useState<
    StudentOnboardingCompleteBody["currentLevel"] | ""
  >("");
  const [weeklyStudyTime, setWeeklyStudyTime] = useState<
    StudentOnboardingCompleteBody["weeklyStudyTime"] | ""
  >("");
  const [preferredLearningStyle, setPreferredLearningStyle] = useState<
    StudentOnboardingCompleteBody["preferredLearningStyle"] | ""
  >("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<
    StudentOnboardingCompleteBody["gender"] | ""
  >("");
  const [birthYear, setBirthYear] = useState("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const profile = await fetchStudentProfile();
      if (profile.interests.length) setInterests(profile.interests);
      if (profile.learningGoals.length) setLearningGoals(profile.learningGoals);
      if (profile.currentLevel) setCurrentLevel(profile.currentLevel);
      if (profile.weeklyStudyTime) setWeeklyStudyTime(profile.weeklyStudyTime);
      if (profile.preferredLearningStyle) {
        setPreferredLearningStyle(profile.preferredLearningStyle);
      }
      if (profile.country) {
        setCountry(normalizeCountryForSelect(profile.country));
      }
      if (profile.phone) setPhone(profile.phone);
      if (profile.gender) setGender(profile.gender);
      if (profile.birthYear) setBirthYear(String(profile.birthYear));

      const fromParam = searchParams.get("from");
      const voluntaryVisit = fromParam === "dashboard" || fromParam === "explore";
      const needsInterests = profile.interests.length === 0;

      // لا نطرد الزائر إذا جاء عمداً (من لوحة التعلّم/الاستكشف) أو لإضافة اهتماماته
      if (!profile.needsOnboarding && !voluntaryVisit && !needsInterests) {
        router.replace("/student");
      }
    } catch {
      /* new user — empty form */
    } finally {
      setLoading(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    void load();
  }, [load]);

  function validateStep(): string | null {
    if (step === 1 && interests.length === 0) {
      return "اختر اهتمامًا واحدًا على الأقل.";
    }
    if (step === 2) {
      if (learningGoals.length === 0) return "اختر هدفًا تعليميًا واحدًا على الأقل.";
      if (!currentLevel) return "اختر مستواك الحالي.";
    }
    return null;
  }

  async function handleComplete(): Promise<void> {
    const stepErr = validateStep();
    if (stepErr) {
      setError(stepErr);
      return;
    }
    if (!currentLevel) {
      setError("اختر مستواك الحالي.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const body: StudentOnboardingCompleteBody = {
        currentLevel,
        learningGoals,
        interests,
      };
      if (weeklyStudyTime) body.weeklyStudyTime = weeklyStudyTime;
      if (preferredLearningStyle) {
        body.preferredLearningStyle = preferredLearningStyle;
      }
      if (country.trim()) body.country = country.trim();
      if (phone.trim()) body.phone = phone.trim();
      if (gender) body.gender = gender;
      if (birthYear.trim()) body.birthYear = Number(birthYear);

      await completeStudentOnboarding(body);
      router.push("/student?onboarding=done");
    } catch (e) {
      setError(
        e instanceof StudentApiError
          ? e.message
          : "تعذّر حفظ ملفك التعليمي.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSkip(): Promise<void> {
    setBusy(true);
    try {
      await skipStudentOnboarding();
      router.push("/student");
    } catch {
      router.push("/student");
    } finally {
      setBusy(false);
    }
  }

  function nextStep(): void {
    const stepErr = validateStep();
    if (stepErr) {
      setError(stepErr);
      return;
    }
    setError(null);
    setStep((s) => Math.min(3, s + 1));
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-xs font-semibold text-primary">مرحبًا بك</p>
        <h1 className="text-2xl font-bold text-heading sm:text-3xl">
          خلّينا نعرفك أكثر
        </h1>
        <p className="text-sm text-muted-foreground">
          حتى نقترح لك كورسات تناسب هدفك — لن تظهر هذه المعلومات للطلاب الآخرين.
        </p>
      </header>

      <div className="flex justify-center gap-2">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              "h-1.5 w-12 rounded-full transition-colors sm:w-16",
              step >= s.id ? "bg-primary" : "bg-muted",
            )}
            aria-hidden
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm ring-1 ring-border/50 sm:p-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-heading">
              ما المجالات التي تهمك؟
            </h2>
            <p className="text-xs text-muted-foreground">
              اختر حتى 10 اهتمامات.
            </p>
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
                        : "border-border/70 bg-muted/20 text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    {opt.labelAr}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-heading">
                ما أهدافك من التعلّم؟
              </h2>
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
                          : "border-border/70 bg-muted/20 text-muted-foreground hover:border-primary/30",
                      )}
                    >
                      {opt.labelAr}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">مستواك الحالي *</Label>
              <div className="flex flex-wrap gap-2">
                {STUDENT_LEVEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCurrentLevel(opt.id)}
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
              <Label className="text-xs font-semibold">
                وقت الدراسة الأسبوعي (اختياري)
              </Label>
              <select
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
              <Label className="text-xs font-semibold">
                أسلوب التعلّم المفضّل (اختياري)
              </Label>
              <select
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
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-heading">
              معلومات إضافية (اختيارية)
            </h2>
            <p className="text-xs text-muted-foreground">
              نستخدم هذه المعلومات لتحسين اقتراحات الكورسات، ولن تظهر للطلاب
              الآخرين.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${formId}-country`} className="text-xs">
                  الدولة
                </Label>
                <CountrySelect
                  id={`${formId}-country`}
                  className="h-9 rounded-lg text-sm"
                  value={country}
                  onChange={setCountry}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${formId}-phone`} className="text-xs">
                  الهاتف
                </Label>
                <Input
                  id={`${formId}-phone`}
                  dir="ltr"
                  className="h-9 rounded-lg text-left text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+962…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${formId}-gender`} className="text-xs">
                  الجنس
                </Label>
                <select
                  id={`${formId}-gender`}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  value={gender}
                  onChange={(e) =>
                    setGender(e.target.value as typeof gender)
                  }
                >
                  <option value="">—</option>
                  {STUDENT_GENDER_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.labelAr}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${formId}-birth`} className="text-xs">
                  سنة الميلاد
                </Label>
                <Input
                  id={`${formId}-birth`}
                  type="number"
                  min={1940}
                  max={new Date().getFullYear()}
                  className="h-9 rounded-lg text-sm"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="2000"
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            disabled={busy}
            onClick={() => void handleSkip()}
          >
            تخطي الآن
          </Button>
          <div className="flex flex-wrap gap-2">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1 rounded-full px-4 text-xs"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setStep((s) => s - 1);
                }}
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                السابق
              </Button>
            ) : null}
            {step < 3 ? (
              <Button
                type="button"
                size="sm"
                className="h-9 gap-1 rounded-full px-4 text-xs shadow-brand"
                onClick={nextStep}
              >
                التالي
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-9 gap-1 rounded-full px-4 text-xs shadow-brand"
                disabled={busy}
                onClick={() => void handleComplete()}
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : null}
                إنهاء
              </Button>
            )}
          </div>
        </div>
      </div>

      {searchParams.get("from") === "dashboard" ? (
        <p className="text-center text-xs text-muted-foreground">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => router.push("/student")}
          >
            العودة للوحة التعلّم
          </button>
        </p>
      ) : null}
    </div>
  );
}
