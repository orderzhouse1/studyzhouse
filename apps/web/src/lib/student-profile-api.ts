import type {
  StudentOnboardingCompleteBody,
  StudentProfileDto,
  StudentProfilePage,
} from "@studyhouse/shared";

import {
  invalidateStudentDataCache,
  studentFetchJson,
  studentFetchJsonCached,
} from "@/lib/student-client-api";

export type StudentProfilePageResponse = {
  success: true;
  data: StudentProfilePage;
};

export type StudentProfileDtoResponse = {
  success: true;
  data: StudentProfileDto;
};

export async function fetchStudentProfilePage(): Promise<StudentProfilePage> {
  const json = await studentFetchJsonCached<StudentProfilePageResponse>(
    "/student/profile",
  );
  return json.data;
}

/** Profile fields only (onboarding, dashboard prompts). */
export async function fetchStudentProfile(): Promise<StudentProfileDto> {
  const page = await fetchStudentProfilePage();
  return page.profile;
}

export async function patchStudentProfile(
  body: Record<string, unknown>,
): Promise<StudentProfilePage> {
  const json = await studentFetchJson<StudentProfilePageResponse>(
    "/student/profile",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  invalidateStudentDataCache();
  return json.data;
}

export async function completeStudentOnboarding(
  body: StudentOnboardingCompleteBody,
): Promise<StudentProfileDto> {
  const json = await studentFetchJson<StudentProfileDtoResponse>(
    "/student/onboarding/complete",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  invalidateStudentDataCache();
  return json.data;
}

export async function skipStudentOnboarding(): Promise<StudentProfileDto> {
  const json = await studentFetchJson<StudentProfileDtoResponse>(
    "/student/onboarding/skip",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
  invalidateStudentDataCache();
  return json.data;
}
