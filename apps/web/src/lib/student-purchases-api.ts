import type { StudentPurchaseItem } from "@studyhouse/shared";

import { studentFetchJsonCached } from "@/lib/student-client-api";

type PurchasesResponse = {
  success: true;
  data: { items: StudentPurchaseItem[] };
};

export async function fetchStudentPurchases(): Promise<StudentPurchaseItem[]> {
  const json = await studentFetchJsonCached<PurchasesResponse>(
    "/student/purchases",
  );
  return json.data.items;
}
