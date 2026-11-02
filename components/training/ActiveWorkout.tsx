"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutSessionWithExercises, WorkoutExerciseWithSets } from "@/lib/services/training";
import type { WorkoutSetRow } from "@/lib/types";
import type { NormalizedSet } from "@/lib/trainingUtils";
import { formatWeight } from "@/lib/trainingUtils";
import { effortLevels, exerciseComparison, nextPlannedSet } from "@/lib/workoutFlow";
import { suggestNext } from "@/lib/trainingCoach";
import { addSet, deleteSet, deleteExercise, deleteSession } from "@/lib/actions/training";
import { finishWorkout, reorderWorkoutExercises, saveWorkoutExerciseNote, saveWorkoutSet } from "@/lib/actions/workoutFlow";
import { ExercisePicker } from "./ExercisePicker";
import { SessionNote } from "./SessionNote";
import { startWorkoutRest, stopWorkoutRest, useWorkoutRest, workoutClock, WorkoutRestTimer } from "./WorkoutRestTimer";

type Draft = { weight: string; reps: string };

export function ActiveWorkout({ session, previous, exerciseNames }: {
  session: WorkoutSessionWithExercises;
  previous: Record<string, NormalizedSet[]>;
  exerciseNames: string[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"live" | "exercises">("live");
  const [summary, setSummary] = useState(false);
  const [effort, setEffort] = useState<number | null>(session.effort_score ?? null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [overrides, setOverrides] = useState<Record<string, WorkoutSetRow>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const timer = useWorkoutRest(session.id);
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const exercises = session.exercises.map(ex => ({ ...ex, sets_list: ex.sets_list.map(s => overrides[s.id] ?? s) }));
  const ids = [...order.filter(id => exercises.some(ex => ex.id === id)), ...exercises.map(ex => ex.id).filter(id => !order.includes(id))];
  exercises.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  const allSets = exercises.flatMap(ex => ex.sets_list);
  const done = allSets.filter(s => s.is_done !== false);
  const next = nextPlannedSet(exercises);
  const focusedExercise = exercises.find(ex => ex.sets_list.some(s => s.id === focusedId));
  const focusedSet = focusedExercise?.sets_list.find(s => s.id === focusedId);
  const current = focusedExercise && focusedSet ? { exercise: focusedExercise, set: focusedSet } : next;
  const elapsed = now === null ? null : Math.max(0, Math.floor((now - Date.parse(session.created_at)) / 1000));
  const migrationReady = allSets.every(s => typeof s.is_done === "boolean");
  const unsaved = allSets.some(s => drafts[s.id] && (Number(drafts[s.id].weight.replace(",", ".")) !== Number(s.weight_kg) || Number(drafts[s.id].reps) !== s.reps));

  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  async function run(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError("");
    try { await work(); } catch (e) { setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen. Bitte erneut versuchen."); }
    finally { setBusy(false); }
  }
  async function save(set: WorkoutSetRow) {
    await run(async () => {
      const draft = drafts[set.id] ?? { weight: String(set.weight_kg), reps: String(set.reps) };
      if (!draft.weight.trim() || !draft.reps.trim()) throw new Error("Bitte Gewicht und Wiederholungen ausfüllen.");
      const saved = await saveWorkoutSet({ id: set.id, weight_kg: Number(draft.weight.replace(",", ".")), reps: Number(draft.reps), is_done: set.is_done === false });
      setOverrides(prev => ({ ...prev, [set.id]: saved }));
      setDrafts(prev => { const copy = { ...prev }; delete copy[set.id]; return copy; });
      setFocusedId(null);
      if (saved.is_done) startWorkoutRest(session.id); else stopWorkoutRest(session.id);
    });
  }
  async function move(id: string, targetId: string) {
    if (id === targetId) return;
    const nextOrder = [...ids];
    const targetIndex = nextOrder.indexOf(targetId);
    nextOrder.splice(nextOrder.indexOf(id), 1);
    nextOrder.splice(targetIndex, 0, id);
    await run(async () => { await reorderWorkoutExercises(session.id, nextOrder); setOrder(nextOrder); });
  }
  const renderSet = (set: WorkoutSetRow, ex: WorkoutExerciseWithSets, index: number) => {
    const draft = drafts[set.id] ?? { weight: String(set.weight_kg), reps: String(set.reps) };
    const completed = set.is_done !== false;
    const change = (patch: Partial<Draft>) => setDrafts(prev => ({ ...prev, [set.id]: { ...draft, ...patch } }));
    return <div className={`workout-set ${completed ? "done" : ""}`} key={set.id}>
      <span className="workout-set-number">{index + 1}<small>{previous[ex.name]?.[index] ? `${formatWeight(previous[ex.name][index].weight_kg)}×${previous[ex.name][index].reps}` : "neu"}</small></span>
      <label><span className="sr-only">Gewicht für {ex.name}, Satz {index + 1} in kg</span><input className="input" inputMode="decimal" value={draft.weight} onChange={e => change({ weight: e.target.value })} disabled={busy || completed} aria-label={`Gewicht in kg, ${ex.name}, Satz ${index + 1}`} /></label>
      <button type="button" className="btn ghost workout-step" onClick={() => change({ reps: String(Math.max(1, (Number(draft.reps) || 1) - 1)) })} disabled={busy || completed} aria-label={`Eine Wiederholung weniger, Satz ${index + 1}`}>−</button>
      <label><span className="sr-only">Wiederholungen</span><input className="input" inputMode="numeric" value={draft.reps} onChange={e => change({ reps: e.target.value })} disabled={busy || completed} aria-label={`Wiederholungen, ${ex.name}, Satz ${index + 1}`} /></label>
      <button type="button" className="btn ghost workout-step" onClick={() => change({ reps: String(Math.min(1000, (Number(draft.reps) || 0) + 1)) })} disabled={busy || completed} aria-label={`Eine Wiederholung mehr, Satz ${index + 1}`}>+</button>
      <button type="button" className={`workout-check ${completed ? "checked" : ""}`} aria-pressed={completed} aria-label={`${ex.name}, Satz ${index + 1}: ${completed ? "Bestätigung aufheben" : "Satz speichern"}`} disabled={busy || !migrationReady} onClick={() => save(set)}>✓</button>
    </div>;
  };

  return <section className="active-workout" aria-label={`Training ${session.title || "Freies Training"}`} aria-busy={busy}>
    <header className="workout-header"><div><span className="workout-eyebrow">{summary ? "Deine Zusammenfassung" : "Training läuft"}</span><h2>{summary ? "Geschafft." : session.title || "Freies Training"}</h2><p>{elapsed === null ? "–:––" : workoutClock(elapsed)} · {done.length}/{allSets.length} Sätze</p></div>
      {!summary && <button className="btn ghost" type="button" disabled={busy} onClick={() => { if (window.confirm("Dieses Training mit allen Einträgen verwerfen?")) run(async () => { const form = new FormData(); form.set("id", session.id); await deleteSession(form); stopWorkoutRest(session.id); }); }} aria-label="Training verwerfen">✕</button>}
    </header>
    {!summary && <progress className="workout-progress" value={done.length} max={Math.max(1, allSets.length)} aria-label={`${done.length} von ${allSets.length} Sätzen bestätigt`} />}
    {!migrationReady && <p role="alert" className="workout-warning">Die Trainings-Datenbank muss zuerst mit Migration 0013 aktualisiert werden. Bis dahin können hier keine Sätze bestätigt werden.</p>}
    {error && <p className="workout-warning" role="alert">{error}</p>}
    {summary ? <>
      <div className="card workout-summary"><h3>Übung für Übung</h3>{exercises.filter(ex => ex.sets_list.some(s => s.is_done !== false)).map(ex => {
        const sets = ex.sets_list.filter(s => s.is_done !== false);
        const best = [...sets].sort((a, b) => b.weight_kg - a.weight_kg || b.reps - a.reps)[0];
        return <div className="workout-summary-row" key={ex.id}><small>{exerciseComparison(sets, previous[ex.name])}</small><strong>{ex.name}</strong><span>{formatWeight(best.weight_kg)} kg × {best.reps}<small>{sets.length} Sätze</small></span></div>;
      })}<p>{done.length} bestätigte Sätze · {Math.round(done.reduce((n, s) => n + s.weight_kg * s.reps, 0)).toLocaleString("de-DE")} kg Volumen</p></div>
      {done.length < allSets.length && <p className="workout-warning">{allSets.length - done.length} unbestätigte Sätze werden nicht in der Auswertung gezählt. Sie bleiben zum späteren Bearbeiten erhalten.</p>}
      <button className="card workout-effort-button" type="button" onClick={() => setRatingOpen(true)}><span><strong>Wie anstrengend war es?</strong><small>{effort === null ? "Optional bewerten" : `${effort} / 10 · ${effortLevels[effort - 1].label}`}</small></span><b>{effort ?? "+"}</b></button>
      <button type="button" className="btn primary workout-finish" disabled={busy || !done.length || !migrationReady} onClick={() => run(async () => { await finishWorkout(session.id, effort); stopWorkoutRest(session.id); router.push("/training?tab=verlauf"); router.refresh(); })}>{busy ? "Wird gespeichert …" : "Training abschließen"}</button>
      <button type="button" className="btn ghost" disabled={busy} onClick={() => setSummary(false)}>Zurück zum Training</button>
    </> : <>
      <div className="workout-modes" role="group" aria-label="Trainingsansicht"><button type="button" aria-pressed={mode === "live"} onClick={() => setMode("live")}>Live-Session</button><button type="button" aria-pressed={mode === "exercises"} onClick={() => setMode("exercises")}>Übungen</button></div>
      <WorkoutRestTimer timer={timer} hero={mode === "live"} />
      {mode === "live" ? <div className="workout-live-panel" onTouchStart={e => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} onTouchEnd={e => {
        if (!touch.current || !current || !exercises.length) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        touch.current = null;
        if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        const index = exercises.findIndex(ex => ex.id === current.exercise.id);
        const ex = exercises[(index + (dx < 0 ? 1 : -1) + exercises.length) % exercises.length];
        setFocusedId(ex.sets_list.find(s => s.is_done === false)?.id ?? ex.sets_list[0]?.id ?? null);
      }}>
        {!timer.state && <div className="workout-live-status"><span>{next ? "Bereit für deinen nächsten Satz" : allSets.length ? "Alle Sätze bestätigt" : "Füge deine erste Übung hinzu"}</span><strong>{done.length}<small> / {allSets.length}</small></strong></div>}
        {current && <div className="card workout-current"><span className="workout-eyebrow">Satz {current.exercise.sets_list.findIndex(s => s.id === current.set.id) + 1} von {current.exercise.sets_list.length}</span><h3>{current.exercise.name}</h3><p>{previous[current.exercise.name]?.length ? `Letztes Mal: ${previous[current.exercise.name].map(s => `${formatWeight(s.weight_kg)}×${s.reps}`).join(" · ")}` : "Erste erfasste Einheit mit dieser Übung"}</p>{renderSet(current.set, current.exercise, current.exercise.sets_list.findIndex(s => s.id === current.set.id))}</div>}
        {current && <button type="button" className="btn primary workout-finish" disabled={busy || !migrationReady} onClick={() => save(current.set)}>{busy ? "Wird gespeichert …" : current.set.is_done === false ? "Satz speichern" : "Satz erneut bearbeiten"}</button>}
        <p className="workout-eyebrow">Wischen oder Übung auswählen</p><div className="fitness-chips">{exercises.map(ex => <button key={ex.id} type="button" className="btn secondary sm" onClick={() => setFocusedId(ex.sets_list.find(s => s.is_done === false)?.id ?? ex.sets_list[0]?.id ?? null)}>{ex.name}</button>)}</div>
      </div> : <div className="workout-exercises">{exercises.map((ex, index) => {
        const complete = ex.sets_list.length > 0 && ex.sets_list.every(s => s.is_done !== false);
        const suggestion = suggestNext(previous[ex.name]);
        return <details key={ex.id} className={`card workout-exercise ${complete ? "complete" : ""}`} open={!complete} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (dragged) move(dragged, ex.id); setDragged(null); }}>
          <summary><span className="workout-drag" draggable={!busy} onDragStart={e => { e.dataTransfer.setData("text/plain", ex.id); setDragged(ex.id); }} onDragEnd={() => setDragged(null)} aria-label="Übung ziehen">≡</span><span>{complete && <b className="workout-complete-tick">✓ </b>}<strong>{ex.name}</strong><small>{previous[ex.name]?.length ? `Zuletzt: ${previous[ex.name].map(s => `${formatWeight(s.weight_kg)}×${s.reps}`).join(" · ")}` : "Erste erfasste Einheit"}</small></span></summary>
          <div className="workout-exercise-tools"><button type="button" className="btn ghost sm" disabled={busy || index === 0} onClick={() => move(ex.id, ids[index - 1])} aria-label={`${ex.name} nach oben`}>↑</button><button type="button" className="btn ghost sm" disabled={busy || index === exercises.length - 1} onClick={() => move(ex.id, ids[index + 1])} aria-label={`${ex.name} nach unten`}>↓</button><button type="button" className="btn ghost sm" disabled={busy} onClick={() => { if (window.confirm(`${ex.name} aus diesem Training entfernen?`)) run(async () => { const form = new FormData(); form.set("id", ex.id); await deleteExercise(form); }); }}>Entfernen</button></div>
          {suggestion && <p className="set-suggestion">Vorschlag: {suggestion.label}<small>{suggestion.reason}</small></p>}
          <div className="workout-set-labels"><span>Satz</span><span>kg</span><span>Wdh.</span></div>
          {ex.sets_list.map((s, i) => renderSet(s, ex, i))}
          <div className="workout-exercise-tools"><button type="button" className="btn secondary sm" disabled={busy} onClick={() => run(async () => { const form = new FormData(); form.set("exercise_id", ex.id); await addSet(form); })}>+ Satz hinzufügen</button>{ex.sets_list.length > 1 && <button type="button" className="btn ghost sm" disabled={busy} onClick={() => { const last = ex.sets_list.at(-1)!; if (last.is_done !== false && !window.confirm("Den letzten bestätigten Satz entfernen?")) return; run(async () => { const form = new FormData(); form.set("id", last.id); await deleteSet(form); }); }}>Letzten Satz entfernen</button>}</div>
          <ExerciseNote key={`${ex.id}:${ex.note ?? ""}`} note={ex.note ?? ""} disabled={busy} onSave={note => run(() => saveWorkoutExerciseNote(ex.id, note))} />
        </details>;
      })}</div>}
      <ExercisePicker sessionId={session.id} existingNames={exerciseNames} />
      <SessionNote sessionId={session.id} note={session.note} />
      {unsaved && <p className="workout-warning">Du hast ungespeicherte Satzwerte. Bestätige sie mit dem Haken, bevor du das Training beendest.</p>}
      <button type="button" className="btn primary workout-finish" disabled={busy || !done.length || unsaved || !migrationReady} onClick={() => setSummary(true)}>Workout beenden</button>
    </>}
    {ratingOpen && <EffortDialog value={effort} onClose={() => setRatingOpen(false)} onSave={value => { setEffort(value); setRatingOpen(false); }} />}
  </section>;
}

function ExerciseNote({ note, disabled, onSave }: { note: string; disabled: boolean; onSave: (note: string) => Promise<void> }) {
  const [text, setText] = useState(note);
  return <details className="workout-note"><summary>Übungsnotiz {note ? "· vorhanden" : "hinzufügen"}</summary><label>Notiz<textarea className="input" maxLength={2000} value={text} onChange={e => setText(e.target.value)} disabled={disabled} /></label><button type="button" className="btn secondary sm" disabled={disabled} onClick={() => onSave(text)}>Notiz speichern</button></details>;
}

function EffortDialog({ value, onSave, onClose }: { value: number | null; onSave: (score: number | null) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [score, setScore] = useState<number | null>(value);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  const level = score === null ? null : effortLevels[score - 1];
  return <dialog className="workout-effort-dialog" ref={ref} aria-labelledby="effort-title" onCancel={onClose}>
    <div className="workout-sheet-handle" /><h2 id="effort-title">Deine Anstrengung</h2><p>Wie fordernd war die gesamte Einheit?</p><output className="workout-effort-value" htmlFor="effort-slider">{score ?? "–"}</output><h3>{level?.label ?? "Noch keine Angabe"}</h3><p>{level?.detail ?? "Die Bewertung ist freiwillig."}</p>
    <div className="workout-effort-range"><input id="effort-slider" className="workout-effort-slider" type="range" min="1" max="10" step="1" value={score ?? 5} onChange={e => setScore(Number(e.target.value))} aria-label="Gefühlte Anstrengung von 1 bis 10" aria-valuetext={score === null ? "Keine Bewertung ausgewählt" : `${score}: ${level?.label}`} /></div>
    <div className="workout-effort-scale"><span>1 · sehr leicht</span><span>10 · maximal</span></div><details><summary>Wie bewerte ich das?</summary><p>Bewerte dein Empfinden für die ganze Einheit. Die Zahl bewertet weder deine Leistung noch die Qualität deines Trainings.</p></details>
    <button type="button" className="btn secondary" onClick={() => setScore(null)}>Angabe entfernen</button><button type="button" className="btn primary" onClick={() => onSave(score)}>Übernehmen</button><button type="button" className="btn ghost" onClick={onClose}>Abbrechen</button>
  </dialog>;
}
