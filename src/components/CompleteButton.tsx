"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { completeWorkout } from "@/lib/actions/member";

export function CompleteButton({ workoutId, label, doneLabel, loginLabel, loginHref, loggedIn, times }: {
  workoutId: number; label: string; doneLabel: string; loginLabel: string; loginHref: string; loggedIn: boolean; times: number;
}) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const t0 = useRef(Date.now());
  useEffect(() => { t0.current = Date.now(); }, []);
  if (!loggedIn) return <Link href={loginHref} className="btn-ghost">{loginLabel}</Link>;
  return (
    <div className="flex items-center gap-4">
      <button
        className={done ? "btn-lime" : "btn-primary"}
        disabled={pending || done}
        onClick={() => start(async () => { const r = await completeWorkout(workoutId, (Date.now() - t0.current) / 1000); if (r.ok) setDone(true); })}
      >
        {done ? doneLabel : label}
      </button>
      {times > 0 && !done && <span className="text-sm text-muted">✓ × {times}</span>}
    </div>
  );
}
