import type { AuditLogDetail, AuditLogListItem } from "@studyhouse/shared";

import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

type ListResponse = {
  success: true;
  data: { items: AuditLogListItem[] };
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

type DetailResponse = { success: true; data: AuditLogDetail };

export async function fetchAuditLogs(
  apiBase: "/admin/audit-logs" | "/super-admin/audit-logs",
  query: string,
): Promise<ListResponse> {
  return adminFetchJson<ListResponse>(`${apiBase}?${query}`);
}

export async function fetchAuditLogDetail(
  apiBase: "/admin/audit-logs" | "/super-admin/audit-logs",
  auditLogId: string,
): Promise<AuditLogDetail> {
  const json = await adminFetchJson<DetailResponse>(
    `${apiBase}/${encodeURIComponent(auditLogId)}`,
  );
  return json.data;
}

export { AdminApiError };
