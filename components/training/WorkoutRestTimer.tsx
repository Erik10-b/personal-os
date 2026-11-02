"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

type Rest = { endsAt: number; total: number; paused: number | null };
const listeners = new Set<() => void>();
const memory = new Map<string, string>();
const key = (id: string) => `workout-rest:${id}`;
const subscribe = (callback: () => void) => {
  listeners.add(callback);
  const notify = () => callback();
  window.addEventListener("storage", notify);
  return () => { listeners.delete(callback); window.removeEventListener("storage", notify); };
};
function read(id: string) {
  try { return localStorage.getItem(key(id)) ?? memory.get(id) ?? "null"; } catch { return memory.get(id) ?? "null"; }
}
function write(id: string, value: Rest | null) {
  const raw = JSON.stringify(value);
  memory.set(id, raw);
  try { localStorage.setItem(key(id), raw); } catch { /* In-memory fallback. */ }
  listeners.forEach(fn => fn());
}
export function parseRest(raw: string): Rest | null {
  try {
    const r = JSON.parse(raw);
    return r && Number.isFinite(r.endsAt) && Number.isFinite(r.total) && r.total >= 15 && r.total <= 600 && (r.paused === null || (Number.isFinite(r.paused) && r.paused >= 0 && r.paused <= 600)) ? r : null;
  } catch { return null; }
}
export function startWorkoutRest(id: string) {
  let total = 90;
  try { const n = Number(localStorage.getItem("training-rest-seconds")); if (n >= 15 && n <= 600) total = n; } catch { /* Default. */ }
  write(id, { endsAt: Date.now() + total * 1000, total, paused: null });
}
export function stopWorkoutRest(id: string) { write(id, null); }
export const workoutClock = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;

export function useWorkoutRest(id: string) {
  const snapshot = useCallback(() => read(id), [id]);
  const raw = useSyncExternalStore(subscribe, snapshot, () => "null");
  const state = useMemo(() => parseRest(raw), [raw]);
  const [now, setNow] = useState(() => Date.now());
  const notified = useRef<string | null>(null);
  useEffect(() => {
    if (!state || state.paused !== null) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [state]);
  const left = state ? state.paused ?? Math.max(0, Math.ceil((state.endsAt - now) / 1000)) : 0;
  useEffect(() => {
    if (!state || state.paused !== null || left > 0) return;
    const token = `${id}:${state.endsAt}`;
    if (notified.current === token) return;
    notified.current = token;
    navigator.vibrate?.([150, 80, 150]);
  }, [id, state, left]);
  function adjust(delta: number) {
    if (!state) return;
    const total = Math.min(600, Math.max(15, state.total + delta));
    const nextLeft = Math.max(0, Math.min(600, left + total - state.total));
    write(id, { total, endsAt: Date.now() + nextLeft * 1000, paused: state.paused === null ? null : nextLeft });
    try { localStorage.setItem("training-rest-seconds", String(total)); } catch { /* Optional preference. */ }
  }
  function pause() {
    if (!state) return;
    write(id, state.paused === null ? { ...state, paused: left } : { ...state, paused: null, endsAt: Date.now() + state.paused * 1000 });
  }
  return { state, left, adjust, pause, stop: () => stopWorkoutRest(id) };
}

export function WorkoutRestTimer({ timer, hero = false }: { timer: ReturnType<typeof useWorkoutRest>; hero?: boolean }) {
  if (!timer.state) return null;
  return <section className={`workout-rest ${hero ? "hero" : "compact"}`} aria-label="Satzpause">
    <div><span>{timer.left === 0 ? "Pause vorbei" : timer.state.paused !== null ? "Pause angehalten" : "Satzpause"}</span><strong role="timer">{workoutClock(timer.left)}</strong></div>
    <div className="workout-rest-controls">
      <button type="button" className="btn secondary" onClick={timer.pause} aria-label={timer.state.paused === null ? "Pausentimer anhalten" : "Pausentimer fortsetzen"}>{timer.state.paused === null ? "Ⅱ" : "▶"}</button>
      <button type="button" className="btn secondary" onClick={() => timer.adjust(-15)}>−15s</button>
      <button type="button" className="btn secondary" onClick={() => timer.adjust(15)}>+15s</button>
      <button type="button" className="btn primary" onClick={timer.stop}>{timer.left === 0 ? "Weiter" : "Pause überspringen"}</button>
    </div>
  </section>;
}
