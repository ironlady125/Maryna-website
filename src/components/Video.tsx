import { getMedia, isPublishable, mediaUrl } from "@/lib/media";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { Placeholder } from "./Photo";

/** Original uploaded video, or an honest "video coming soon" placeholder (never a fake demo). */
export async function Video({ id, locale, className = "" }: { id: number | null | undefined; locale: Locale; className?: string }) {
  const m = await getMedia(id);
  if (!isPublishable(m) || m.kind !== "video") {
    return <Placeholder className={`aspect-video rounded-2xl ${className}`} label={getDict(locale).common.videoComingSoon} />;
  }
  return (
    <video
      className={`aspect-video w-full rounded-2xl bg-black ${className}`}
      src={mediaUrl(m.id)}
      poster={m.posterId ? mediaUrl(m.posterId) : undefined}
      controls
      preload="metadata"
      playsInline
      controlsList="nodownload"
    />
  );
}
