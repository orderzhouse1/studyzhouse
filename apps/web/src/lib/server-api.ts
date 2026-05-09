export function getInternalApiOrigin(): string {
  return process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000";
}

export async function fetchPublicApi(path: string): Promise<unknown> {
  const url = `${getInternalApiOrigin()}${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`PUBLIC_API_${res.status}`);
  }
  return res.json();
}

export async function fetchPublicApiMaybe(path: string): Promise<unknown | null> {
  const url = `${getInternalApiOrigin()}${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`PUBLIC_API_${res.status}`);
  }
  return res.json();
}
