import type { StudentSavedCourseItem } from "@studyhouse/shared";

import {
  studentFetchJson,
  studentFetchJsonCached,
} from "@/lib/student-client-api";

type SavedCoursesResponse = {
  success: true;
  data: { items: StudentSavedCourseItem[] };
};

type SavedIdsResponse = {
  success: true;
  data: { courseIds: string[] };
};

export async function fetchStudentSavedCourses(): Promise<
  StudentSavedCourseItem[]
> {
  const json = await studentFetchJsonCached<SavedCoursesResponse>(
    "/student/saved-courses",
  );
  return json.data.items;
}

export async function fetchStudentSavedCourseIds(): Promise<string[]> {
  const json = await studentFetchJsonCached<SavedIdsResponse>(
    "/student/saved-courses/ids",
  );
  return json.data.courseIds;
}

export async function saveStudentCourse(courseId: string): Promise<void> {
  await studentFetchJson(`/student/courses/${courseId}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

export async function unsaveStudentCourse(courseId: string): Promise<void> {
  await studentFetchJson(`/student/courses/${courseId}/save`, {
    method: "DELETE",
  });
}
