"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

/* Abgehakte Sätze — nur eine Komfort-Markierung pro Gerät, deshalb localStorage statt Datenbank. */

const doneListeners = new Set<() => void>();
const doneKey = (sessionId: string) => `training-done:${sessionId}`;

function readDone(sessionId: string): string {
  try {
    return localStorage.getItem(doneKey(sessionId)) ?? "[]";
  } catch {
    return "[]";
  }
}

export function useDoneSets(sessionId: string) {
  const subscribe = useCallback((cb: () => void) => {
    doneListeners.add(cb);
    return () => { doneListeners.delete(cb); };
  }, []);
  const raw = useSyncExternalStore(subscribe, () => readDone(sessionId), () => "[]");
  const done = useMemo(() => new Set<string>(JSON.parse(raw) as string[]), [raw]);

  const toggle = useCallback((setId: string) => {
    const next = new Set<string>(JSON.parse(readDone(sessionId)) as string[]);
    const nowDone = !next.has(setId);
    if (nowDone) next.add(setId);
    else next.delete(setId);
    try {
      localStorage.setItem(doneKey(sessionId), JSON.stringify([...next]));
    } catch {
      // Ohne Speicher gilt der Haken nur bis zum Neuladen.
    }
    doneListeners.forEach((cb) => cb());
    return nowDone;
  }, [sessionId]);

  return { done, toggle };
}

/* Pausentimer: ein gemeinsamer Zustand für die ganze Session. */

interface RestState { endsAt: number; total: number }
let rest: RestState | null = null;
const restListeners = new Set<() => void>();
const emitRest = () => restListeners.forEach((cb) => cb());
const subscribeRest = (cb: () => void) => { restListeners.add(cb); return () => { restListeners.delete(cb); }; };

function defaultRestSeconds(): number {
  try {
    const saved = Number(localStorage.getItem("training-rest-seconds"));
    return saved >= 15 && saved <= 600 ? saved : 90;
  } catch {
    return 90;
  }
}

export function startRest() {
  const total = defaultRestSeconds();
  rest = { endsAt: Date.now() + total * 1000, total };
  emitRest();
}

export function stopRest() {
  rest = null;
  emitRest();
}

function adjustRest(delta: number) {
  if (!rest) return;
  const total = Math.min(600, Math.max(15, rest.total + delta));
  rest = { endsAt: rest.endsAt + (total - rest.total) * 1000, total };
  try { localStorage.setItem("training-rest-seconds", String(total)); } catch { /* egal */ }
  emitRest();
}

function signalEnd() {
  navigator.vibrate?.([200, 100, 200]);
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    osc.onended = () => ctx.close();
  } catch {
    // Kein Audio — Vibration und Anzeige reichen.
  }
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function RestTimer() {
  const state = useSyncExternalStore(subscribeRest, () => rest, () => null);
  const [now, setNow] = useState(() => Date.now());
  const signalled = useRef<number | null>(null);

  useEffect(() => {
    if (!state) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state]);

  const left = state ? Math.max(0, Math.ceil((state.endsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!state || left > 0 || signalled.current === state.endsAt) return;
    signalled.current = state.endsAt;
    signalEnd();
    const id = setTimeout(stopRest, 4000);
    return () => clearTimeout(id);
  }, [state, left]);

  if (!state) return null;
  const progress = Math.min(1, 1 - left / state.total);

  return (
    <div className={`rest-timer${left === 0 ? " finished" : ""}`} role="timer" aria-live={left === 0 ? "assertive" : "off"}>
      <div className="rest-timer-bar" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <div className="rest-timer-time">
        <span>{left === 0 ? "Pause vorbei" : "Pause"}</span>
        <strong>{clock(left)}</strong>
      </div>
      <div className="rest-timer-actions">
        <button type="button" onClick={() => adjustRest(-15)} aria-label="15 Sekunden kürzer">−15</button>
        <button type="button" onClick={() => adjustRest(15)} aria-label="15 Sekunden länger">+15</button>
        <button type="button" className="rest-timer-skip" onClick={stopRest}>{left === 0 ? "OK" : "Weiter"}</button>
      </div>
    </div>
  );
}
