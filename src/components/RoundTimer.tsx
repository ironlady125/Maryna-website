"use client";
import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/i18n";

type Phase = "idle" | "work" | "rest" | "done";
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const r = (s: string, v: Record<string, number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

function beep(freq = 880, ms = 180) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    o.start();
    o.stop(ctx.currentTime + ms / 1000);
  } catch {
    /* audio not available */
  }
}

/** Configurable boxing round timer (2/3/4-minute rounds, adjustable rest). */
export function RoundTimer({ t, rounds: r0, roundSec: rs0, restSec: rest0 }: { t: Dict["workout"]; rounds: number; roundSec: number; restSec: number }) {
  const [rounds, setRounds] = useState(r0 || 3);
  const [roundSec, setRoundSec] = useState(rs0 || 180);
  const [restSec, setRestSec] = useState(rest0 || 60);
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(1);
  const [left, setLeft] = useState(roundSec);
  const [running, setRunning] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === "idle") setLeft(roundSec);
  }, [roundSec, phase]);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (left === 10 && phase === "work") beep(660, 120);
    if (left > 0) return;
    if (phase === "work") {
      if (round >= rounds) { setPhase("done"); setRunning(false); beep(440, 600); return; }
      setPhase("rest"); setLeft(restSec); beep(520, 400);
    } else if (phase === "rest") {
      setRound((n) => n + 1); setPhase("work"); setLeft(roundSec); beep(880, 400);
    }
  }, [left, running, phase, round, rounds, restSec, roundSec]);

  const start = () => {
    if (phase === "idle" || phase === "done") { setPhase("work"); setRound(1); setLeft(roundSec); beep(); }
    setRunning(true);
  };
  const reset = () => { setRunning(false); setPhase("idle"); setRound(1); setLeft(roundSec); };
  const total = phase === "rest" ? restSec : roundSec;
  const pct = phase === "idle" ? 0 : ((total - left) / total) * 100;
  const color = phase === "rest" ? "var(--brand-lime)" : "var(--brand-accent)";

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="eyebrow">{t.timer}</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <label className="flex items-center gap-1.5 text-muted">{t.rounds}
            <select disabled={running} value={rounds} onChange={(e) => setRounds(+e.target.value)} className="rounded-lg border border-line bg-bg px-2 py-1 text-ink">
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-muted">{t.roundLength}
            <select disabled={running} value={roundSec} onChange={(e) => setRoundSec(+e.target.value)} className="rounded-lg border border-line bg-bg px-2 py-1 text-ink">
              {[30, 60, 90, 120, 150, 180, 240, 300].map((n) => <option key={n} value={n}>{fmtTime(n)}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-muted">{t.restLength}
            <select disabled={running} value={restSec} onChange={(e) => setRestSec(+e.target.value)} className="rounded-lg border border-line bg-bg px-2 py-1 text-ink">
              {[15, 30, 45, 60, 90, 120].map((n) => <option key={n} value={n}>{fmtTime(n)}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 px-5 py-8">
        <div className="text-xs uppercase tracking-[0.3em]" style={{ color }}>
          {phase === "rest" ? t.rest : phase === "done" ? t.done : t.work} · {r(t.round, { n: Math.min(round, rounds), total: rounds })}
        </div>
        <div className="font-display text-7xl tabular-nums sm:text-8xl" aria-live="polite">{fmtTime(Math.max(0, left))}</div>
        <div className="mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-surface-2">
          <div className="h-full transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="mt-5 flex gap-3">
          {running ? (
            <button className="btn-ghost" onClick={() => setRunning(false)}>{t.pause}</button>
          ) : (
            <button className="btn-primary" onClick={start}>{phase === "work" || phase === "rest" ? t.resume : t.startTimer}</button>
          )}
          <button className="btn-ghost" onClick={reset}>{t.reset}</button>
        </div>
      </div>
    </div>
  );
}
