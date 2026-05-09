/** Standard JSON-serializable API error payload from Express. */
export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/** Generic success wrapper for JSON responses. */
export type ApiSuccessBody<T> = {
  success: true;
  data: T;
};

export type ApiResponse<T> = ApiSuccessBody<T> | ApiErrorBody;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  meta: PaginationMeta;
};
