import { AppError } from "../lib/AppError.js";

const YT_API = "https://www.googleapis.com/youtube/v3";
export const YOUTUBE_PLAYLIST_IMPORT_MAX_VIDEOS = 100;

export type NormalizedPlaylistVideo = {
  youtubeVideoId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  position: number;
};

function pickThumbnail(snippet: {
  thumbnails?: Record<string, { url?: string } | undefined>;
}): string | null {
  const t = snippet.thumbnails;
  if (!t) return null;
  return (
    t.medium?.url ??
    t.high?.url ??
    t.standard?.url ??
    t.default?.url ??
    null
  );
}

function truncateDescription(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function requireYoutubeDataApiKey(): string {
  const k = process.env.YOUTUBE_API_KEY?.trim();
  if (!k) {
    throw new AppError(
      "YOUTUBE_NOT_CONFIGURED",
      "استيراد قوائم يوتيوب غير مفعّل: يجب ضبط المتغير YOUTUBE_API_KEY على الخادم.",
      400,
    );
  }
  return k;
}

async function youtubeJson<T>(
  url: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: string }> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: text };
  }
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: res.status, body: text };
  }
}

export async function fetchPlaylistTitle(
  apiKey: string,
  playlistId: string,
): Promise<string | null> {
  const url = `${YT_API}/playlists?part=snippet&id=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(apiKey)}`;
  const got = await youtubeJson<{
    items?: Array<{ snippet?: { title?: string } }>;
  }>(url);
  if (!got.ok) {
    return null;
  }
  const title = got.data.items?.[0]?.snippet?.title;
  return typeof title === "string" && title.trim() ? title.trim() : null;
}

/**
 * يجلب عناصر قائمة التشغيل مع التصفح (حد أقصى YOUTUBE_PLAYLIST_IMPORT_MAX_VIDEOS).
 */
export async function fetchPlaylistVideosNormalized(
  apiKey: string,
  playlistId: string,
): Promise<{
  playlistTitle: string | null;
  videos: NormalizedPlaylistVideo[];
}> {
  const playlistTitle = await fetchPlaylistTitle(apiKey, playlistId);

  const videos: NormalizedPlaylistVideo[] = [];
  let pageToken: string | undefined;

  for (;;) {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "50",
      key: apiKey,
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const url = `${YT_API}/playlistItems?${params.toString()}`;
    const got = await youtubeJson<{
      nextPageToken?: string;
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          thumbnails?: Record<string, { url?: string } | undefined>;
        };
        contentDetails?: { videoId?: string };
      }>;
      error?: { message?: string; errors?: Array<{ message?: string }> };
    }>(url);

    if (!got.ok) {
      let msg = "تعذّر الاتصال بخدمة يوتيوب.";
      try {
        const j = JSON.parse(got.body) as {
          error?: { message?: string };
        };
        if (j.error?.message) {
          msg = `خطأ YouTube API: ${j.error.message}`;
        }
      } catch {
        if (got.status === 403) {
          msg =
            "رفض YouTube الطلب — تحقق من المفتاح والحصة (Quota) أو صلاحيات القائمة.";
        } else if (got.status === 404) {
          msg = "قائمة التشغيل غير موجودة أو غير متاحة.";
        }
      }
      throw new AppError("YOUTUBE_API_ERROR", msg, 502, {
        status: got.status,
      });
    }

    const data = got.data;
    if (data.error?.message) {
      throw new AppError(
        "YOUTUBE_API_ERROR",
        `خطأ YouTube: ${data.error.message}`,
        400,
      );
    }

    const items = data.items ?? [];
    for (const it of items) {
      const vid = it.contentDetails?.videoId?.trim();
      if (!vid || vid.length !== 11) {
        continue;
      }
      const sn = it.snippet;
      const title =
        typeof sn?.title === "string" && sn.title.trim()
          ? sn.title.trim()
          : `فيديو ${vid}`;
      const descRaw = typeof sn?.description === "string" ? sn.description : "";
      videos.push({
        youtubeVideoId: vid,
        title: title.slice(0, 500),
        description: truncateDescription(descRaw, 4000),
        thumbnailUrl: sn ? pickThumbnail(sn) : null,
        position: videos.length + 1,
      });

      if (videos.length >= YOUTUBE_PLAYLIST_IMPORT_MAX_VIDEOS) {
        return { playlistTitle, videos };
      }
    }

    pageToken = data.nextPageToken;
    if (!pageToken || videos.length >= YOUTUBE_PLAYLIST_IMPORT_MAX_VIDEOS) {
      break;
    }
  }

  return { playlistTitle, videos };
}
