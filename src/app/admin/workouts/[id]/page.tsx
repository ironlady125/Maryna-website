import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, exercises, programs, workouts } from "@/db";
import { adminDict } from "@/admin/i18n";
import { BiField, Check, Field, PageHead, Save, SavedBanner, Section } from "@/admin/ui";
import { ConfirmButton, MediaPicker, Sortable, SubmitButton } from "@/admin/client";
import { deleteExercise, deleteWorkout, saveExercise, saveWorkout } from "@/admin/actions";
import { missingLangs } from "@/lib/l10n";

export default async function WorkoutEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const id = Number((await params).id);
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const ru = lang === "ru";
  const [w] = await db.select().from(workouts).where(eq(workouts.id, id)).limit(1);
  if (!w) notFound();
  const [p] = await db.select().from(programs).where(eq(programs.id, w.programId)).limit(1);
  const ex = await db.select().from(exercises).where(eq(exercises.workoutId, w.id)).orderBy(asc(exercises.sortOrder));
  const pick = { chooseText: a.choose, removeText: a.remove, uploadText: a.dropHere, uploadingText: a.uploading };
  const missing = (e: Record<string, unknown>) => ["title", "desc", "cues", "dose"].some((f) => missingLangs(e, f).length === 1);

  return (
    <div className="max-w-5xl">
      <PageHead title={ru ? w.titleRu || w.titleEn : w.titleEn || w.titleRu} back={`/admin/programs/${w.programId}`} sub={p ? (ru ? p.titleRu : p.titleEn) : ""} />
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <form action={saveWorkout}>
        <input type="hidden" name="id" value={w.id} />
        <input type="hidden" name="programId" value={w.programId} />
        <Section>
          <div className="space-y-4">
            <BiField label={a.title} name="title" row={w} missingText={a.missing} />
            <BiField label={a.description} name="desc" row={w} area rows={2} missingText={a.missing} />
            <div className="grid gap-4 md:grid-cols-4">
              <Field label={a.minutes} name="minutes" type="number" defaultValue={w.minutes} />
              <Field label={a.rounds} name="rounds" type="number" defaultValue={w.rounds} />
              <Field label={a.roundSec} name="roundSec" type="number" defaultValue={w.roundSec} />
              <Field label={a.restSec} name="restSec" type="number" defaultValue={w.restSec} />
            </div>
            <MediaPicker name="videoId" value={w.videoId} kind="video" label={`${a.video} (${ru ? "вся тренировка" : "full workout"})`} {...pick} />
            <Check label={a.preview} name="isPreview" defaultChecked={w.isPreview} />
          </div>
        </Section>
        <Save label={a.save} />
      </form>

      <Section title={a.exercises}>
        <Sortable table="exercises" hint={a.sortHint} items={ex.map((e) => ({ id: e.id, label: ru ? e.titleRu || e.titleEn : e.titleEn || e.titleRu, sub: ru ? e.doseRu : e.doseEn, href: `#ex-${e.id}`, badge: missing(e) ? a.missing : undefined }))} />
      </Section>

      {[...ex, null].map((e) => (
        <details key={e?.id ?? "new"} id={`ex-${e?.id ?? "new"}`} className="card mb-3 p-5" open={!e}>
          <summary className="cursor-pointer font-display uppercase">
            {e ? `${ru ? e.titleRu || e.titleEn : e.titleEn || e.titleRu}` : `+ ${a.add}: ${a.exercises}`}
            {e && missing(e) && <span className="ml-2 rounded bg-accent/20 px-1.5 text-[10px] text-accent">⚠ {a.missing}</span>}
          </summary>
          <form action={saveExercise} className="mt-5 space-y-4">
            <input type="hidden" name="id" value={e?.id ?? ""} />
            <input type="hidden" name="workoutId" value={w.id} />
            <BiField label={a.title} name="title" row={e} missingText={a.missing} />
            <BiField label={a.description} name="desc" row={e} area rows={2} missingText={a.missing} />
            <BiField label={a.cues} name="cues" row={e} area rows={3} missingText={a.missing} />
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_140px]">
              <Field label={`${a.dose} EN`} name="doseEn" defaultValue={e?.doseEn} placeholder="3 rounds × 2 min" />
              <Field label={`${a.dose} RU`} name="doseRu" defaultValue={e?.doseRu} placeholder="3 раунда × 2 мин" />
              <Field label={a.minutes} name="minutes" type="number" defaultValue={e?.minutes ?? 3} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <MediaPicker name="videoId" value={e?.videoId ?? null} kind="video" label={ru ? "Видео упражнения (только ваше оригинальное)" : "Exercise video (your original upload only)"} {...pick} />
              <MediaPicker name="thumbId" value={e?.thumbId ?? null} label={a.thumb} {...pick} />
            </div>
            <div className="flex items-center justify-between">
              <SubmitButton label={a.save} />
            </div>
          </form>
          {e && <form action={deleteExercise} className="mt-3"><input type="hidden" name="id" value={e.id} /><ConfirmButton label={a.delete} confirm={a.confirmDelete} /></form>}
        </details>
      ))}

      <form action={deleteWorkout} className="mt-6"><input type="hidden" name="id" value={w.id} /><ConfirmButton label={`${a.delete}: ${ru ? "тренировку" : "workout"}`} confirm={a.confirmDelete} /></form>
    </div>
  );
}
