"use client";

import { useMemo } from "react";

export function LearnYoutubePlayer({
  videoId,
  title,
  startSeconds,
}: {
  videoId: string;
  title: string;
  /** عند تغيّره يُعاد تحميل iframe للانتقال للوقت المطلوب */
  startSeconds?: number | null;
}): React.ReactElement {
  const src = useMemo(() => {
    const base = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`;
    if (startSeconds != null && startSeconds > 0) {
      return `${base}&start=${Math.floor(startSeconds)}`;
    }
    return base;
  }, [videoId, startSeconds]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-heading">
        <iframe
          key={src}
          title={title}
          className="h-full w-full"
          src={src}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
