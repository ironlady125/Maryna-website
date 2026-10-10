"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setPoster } from "./actions";

/** Click the photo to choose the focal point used when the layout crops it. The image itself is never altered. */
export function FocalPicker({ src, x, y, label }: { src: string; x: number; y: number; label: string }) {
  const [p, setP] = useState({ x, y });
  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name="focalX" value={p.x} />
      <input type="hidden" name="focalY" value={p.y} />
      <div
        className="relative cursor-crosshair overflow-hidden rounded-xl border border-line"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setP({ x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) });
        }}
      >
        <img src={src} alt="" className="block w-full" />
        <span className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_var(--brand-accent)]" style={{ left: `${p.x}%`, top: `${p.y}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {["aspect-square", "aspect-[4/5]", "aspect-video"].map((c) => (
          <div key={c} className={`${c} overflow-hidden rounded-lg border border-line`}>
            <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${p.x}% ${p.y}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grab the current frame of the uploaded video and save it as the thumbnail. */
export function PosterCapture({ videoId, label, savingLabel }: { videoId: number; label: string; savingLabel: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const capture = async () => {
    const v = ref.current;
    if (!v || !v.videoWidth) return;
    setBusy(true);
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.88));
    const q = new URLSearchParams({ name: `poster-${videoId}.jpg`, type: "image/jpeg", w: String(c.width), h: String(c.height), folder: "thumbnails" });
    const r = await fetch(`/api/admin/media/upload?${q}`, { method: "POST", body: blob });
    if (r.ok) await setPoster(videoId, (await r.json()).id);
    setBusy(false);
    router.refresh();
  };
  return (
    <div className="space-y-3">
      <video ref={ref} src={`/media/${videoId}`} controls preload="metadata" className="w-full rounded-xl bg-black" />
      <button type="button" className="btn-ghost" onClick={capture} disabled={busy}>{busy ? savingLabel : label}</button>
    </div>
  );
}
