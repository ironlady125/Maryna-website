import { notFound } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { categories, db, exercises, media, programs, workouts } from "@/db";
import { adminDict } from "@/admin/i18n";
import { BiField, Check, Field, PageHead, Save, SavedBanner, Section, Select, Area } from "@/admin/ui";
import { ConfirmButton, MediaPicker, Uploader } from "@/admin/client";
import { FocalPicker, PosterCapture } from "@/admin/media-client";
import { deleteMedia, saveMedia } from "@/admin/actions";

export default async function MediaEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const id = Number((await params).id);
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const ru = lang === "ru";
  const [m] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!m) notFound();
  const usedIn = [
    ...(await db.select({ t: categories.titleEn }).from(categories).where(eq(categories.coverId, id))).map((x) => `Category: ${x.t}`),
    ...(await db.select({ t: programs.titleEn }).from(programs).where(or(eq(programs.coverId, id), eq(programs.trailerId, id)))).map((x) => `Program: ${x.t}`),
    ...(await db.select({ t: workouts.titleEn }).from(workouts).where(eq(workouts.videoId, id))).map((x) => `Workout: ${x.t}`),
    ...(await db.select({ t: exercises.titleEn }).from(exercises).where(or(eq(exercises.videoId, id), eq(exercises.thumbId, id)))).map((x) => `Exercise: ${x.t}`),
  ];
  const pick = { chooseText: a.choose, removeText: a.remove, uploadText: a.dropHere, uploadingText: a.uploading };
  return (
    <div className="max-w-5xl">
      <PageHead title={m.filename} back="/admin/media" sub={`${m.kind} · ${(m.size / 1048576).toFixed(1)} MB${m.width ? ` · ${m.width}×${m.height}` : ""}`} />
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <form action={saveMedia}>
        <input type="hidden" name="id" value={m.id} />
        <div className="grid gap-6 lg:grid-cols-2">
          <Section>
            {m.kind === "image" ? (
              <FocalPicker src={`/media/${m.id}?v=${m.size}`} x={m.focalX} y={m.focalY} label={ru ? "Точка кадрирования (нажмите на фото)" : "Crop focus (click the photo)"} />
            ) : (
              <>
                <input type="hidden" name="focalX" value={m.focalX} />
                <input type="hidden" name="focalY" value={m.focalY} />
                <PosterCapture videoId={m.id} label={ru ? "Сделать превью из текущего кадра" : "Use current frame as thumbnail"} savingLabel={a.uploading} />
                <div className="mt-4"><MediaPicker name="posterId" value={m.posterId} label={a.thumb} {...pick} /></div>
              </>
            )}
            {m.kind === "image" && <input type="hidden" name="posterId" value="" />}
          </Section>
          <div>
            <Section title={ru ? "Описание" : "Details"}>
              <div className="space-y-4">
                <BiField label="Alt" name="alt" row={m} missingText={a.missing} hint={ru ? "Короткое описание фото для незрячих и поисковиков." : "Short description for screen readers and search engines."} />
                <Field label={ru ? "Папка" : "Folder"} name="folder" defaultValue={m.folder} />
                {m.kind === "video" && <Check label={ru ? "Публичное видео (доступно всем, например видео на главной)" : "Public video (anyone can watch, e.g. homepage video)"} name="isPublic" defaultChecked={m.isPublic} />}
              </div>
            </Section>
            <Section title={ru ? "Права на использование" : "Usage rights"}>
              <div className="space-y-4">
                <Select label={a.status} name="licenseStatus" defaultValue={m.licenseStatus} options={[
                  ["owned", ru ? "Моё фото / видео" : "My own photo / video"],
                  ["licensed", ru ? "Куплена лицензия" : "Licensed"],
                  ["permission", ru ? "Есть письменное разрешение" : "Written permission"],
                  ["unverified", ru ? "Права не подтверждены — не показывать на сайте" : "Rights unverified — hide from the site"],
                ]} />
                <Field label={ru ? "Автор / фотограф" : "Credit / photographer"} name="credit" defaultValue={m.credit} />
                <Area label={ru ? "Заметка о лицензии" : "License note"} name="licenseNote" defaultValue={m.licenseNote} rows={2} />
              </div>
            </Section>
          </div>
        </div>
        <Save label={a.save} />
      </form>
      <Section title={ru ? "Заменить файл" : "Replace file"}>
        <Uploader label={a.dropHere} uploading={a.uploading} replaceId={m.id} accept={m.kind === "image" ? "image/*" : "video/*"} />
      </Section>
      {usedIn.length > 0 && <Section title={ru ? "Используется" : "Used in"}><ul className="list-disc pl-5 text-sm text-muted">{usedIn.map((u) => <li key={u}>{u}</li>)}</ul></Section>}
      <form action={deleteMedia} className="mt-4"><input type="hidden" name="id" value={m.id} /><ConfirmButton label={a.delete} confirm={a.confirmDelete} /></form>
    </div>
  );
}
