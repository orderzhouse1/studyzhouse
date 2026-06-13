import type { LessonNoteItem } from "@studyhouse/shared";

import {
  StudentApiError,
  studentFetchJson,
} from "@/lib/student-client-api";

type NotesListResponse = { success: true; data: { items: LessonNoteItem[] } };
type NoteResponse = { success: true; data: LessonNoteItem };

export async function fetchLessonNotes(
  lessonId: string,
): Promise<LessonNoteItem[]> {
  const json = await studentFetchJson<NotesListResponse>(
    `/student/lessons/${encodeURIComponent(lessonId)}/notes`,
  );
  return json.data.items;
}

export async function createLessonNote(
  lessonId: string,
  body: { body: string; timestampSeconds?: number },
): Promise<LessonNoteItem> {
  const json = await studentFetchJson<NoteResponse>(
    `/student/lessons/${encodeURIComponent(lessonId)}/notes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return json.data;
}

export async function updateLessonNote(
  noteId: string,
  body: { body?: string; timestampSeconds?: number | null },
): Promise<LessonNoteItem> {
  const json = await studentFetchJson<NoteResponse>(
    `/student/lesson-notes/${encodeURIComponent(noteId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return json.data;
}

export async function deleteLessonNote(noteId: string): Promise<void> {
  await studentFetchJson<{ success: true }>(
    `/student/lesson-notes/${encodeURIComponent(noteId)}`,
    { method: "DELETE" },
  );
}

export { StudentApiError };
