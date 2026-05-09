/** API version segment used in Express routes (e.g. /api/v1). */
export const API_VERSION = "v1";

/** Base path for REST routes on the API server. */
export function apiBasePath(version: string = API_VERSION): string {
  return `/api/${version}`;
}

export const APP_NAME_AR = "منصة ستاديهاوس";

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_PAGE_SIZE = 100;

/** HttpOnly cookie carrying the signed JWT access token (set by Express). */
export const AUTH_ACCESS_COOKIE_NAME = "studyhouse_access";
