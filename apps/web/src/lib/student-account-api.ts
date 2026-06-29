import { invalidateStudentDataCache, studentFetchJson } from "@/lib/student-client-api";

type DeactivateResponse = {
  success: true;
  data: { message: string };
};

export async function deactivateStudentAccount(): Promise<void> {
  await studentFetchJson<DeactivateResponse>("/student/account/deactivate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  invalidateStudentDataCache();
}
