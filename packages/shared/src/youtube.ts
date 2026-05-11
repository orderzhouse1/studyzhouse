/** استخراج معرف فيديو يوتيوب من الرابط — بدون YouTube Data API */

const ID_RE = /^[\w-]{11}$/;

function normalizeId(id: string | null | undefined): string | null {
  if (!id) return null;
  const t = id.trim();
  return ID_RE.test(t) ? t : null;
}

export function parseYoutubeVideoId(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;

  try {
    const withProto = /^https?:\/\//i.test(input)
      ? input
      : `https://${input}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const seg = u.pathname.split("/").filter(Boolean)[0];
      return normalizeId(seg ?? null);
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "www.youtube.com"
    ) {
      if (u.pathname === "/watch" || u.pathname.startsWith("/watch/")) {
        return normalizeId(u.searchParams.get("v"));
      }
      const embed = u.pathname.match(/^\/embed\/([\w-]{11})/);
      if (embed?.[1]) return normalizeId(embed[1]);
      const shorts = u.pathname.match(/^\/shorts\/([\w-]{11})/);
      if (shorts?.[1]) return normalizeId(shorts[1]);
      const live = u.pathname.match(/^\/live\/([\w-]{11})/);
      if (live?.[1]) return normalizeId(live[1]);
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeYoutubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

const PLAYLIST_ID_RE = /^[a-zA-Z0-9_-]{10,}$/;

/**
 * يستخرج معرف قائمة تشغيل يوتيوب من رابط يحتوي list= أو من معرف خام.
 */
export function parseYoutubePlaylistId(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;

  try {
    const withProto = /^https?:\/\//i.test(input)
      ? input
      : `https://${input}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "www.youtube.com"
    ) {
      const list = u.searchParams.get("list");
      if (list && PLAYLIST_ID_RE.test(list)) {
        return list;
      }
    }
  } catch {
    // fall through
  }

  const q = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (q?.[1] && PLAYLIST_ID_RE.test(q[1])) {
    return q[1];
  }

  if (PLAYLIST_ID_RE.test(input)) {
    return input;
  }

  return null;
}

