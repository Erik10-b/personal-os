"use client";

import { FocusEvent } from "react";
import { addSet, deleteExercise, deleteSet, updateSet } from "@/lib/actions/training";
import { WorkoutExerciseWithSets } from "@/lib/services/training";
import type { NormalizedSet } from "@/lib/trainingUtils";
import { formatWeight } from "@/lib/trainingUtils";
import type { Suggestion } from "@/lib/trainingCoach";
import { startRest, stopRest, useDoneSets } from "./RestTimer";

const capStyle: React.CSSProperties = {
  fontSize: 9,
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

export function SessionExerciseCard({
  exercise,
  prevSummary,
  prevSets,
  suggestion,
}: {
  exercise: WorkoutExerciseWithSets;
  prevSummary?: string;
  prevSets?: NormalizedSet[];
  suggestion?: Suggestion | null;
}) {
  const submit = (e: FocusEvent<HTMLInputElement>) => e.currentTarget.form?.requestSubmit();
  const sets = [...exercise.sets_list].sort((a, b) => a.position - b.position);
  const { done, toggle } = useDoneSets(exercise.session_id);

  function toggleSet(setId: string) {
    if (toggle(setId)) startRest();
    else stopRest();
  }

  return (
    <div
      style={{
        background: "var(--bg-surface-2)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "12px",
        marginBottom: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, display: "block" }}>{exercise.name}</span>
          {prevSummary && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-tertiary)" }}>
              Letztes Mal: {prevSummary}
            </span>
          )}
          {suggestion && (
            <span className="set-suggestion" title={suggestion.reason}>
              Vorschlag heute: <strong>{suggestion.label}</strong>
              <small>{suggestion.reason}</small>
            </span>
          )}
        </div>
        <form action={deleteExercise}>
          <input type="hidden" name="id" value={exercise.id} />
          <button type="submit" className="btn ghost sm" title="Übung entfernen">
            ✕
          </button>
        </form>
      </div>

      {/* Kopfzeile der Satz-Spalten */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px 4px" }}>
        <span style={{ ...capStyle, width: 48 }}>Satz</span>
        <span style={{ ...capStyle, flex: 1, textAlign: "center" }}>kg</span>
        <span style={{ ...capStyle, flex: 1, textAlign: "center" }}>Wdh.</span>
        <span style={{ width: 40 }} />
        <span style={{ width: 30 }} />
      </div>

      {sets.map((set, i) => (
        <div key={set.id} className={`set-row${done.has(set.id) ? " done" : ""}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 4px" }}>
          <span style={{ width: 48, fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            {i + 1}.
            {prevSets?.[i] && (
              <span className="set-prev" title="Dieser Satz beim letzten Mal">
                {prevSets[i].weight_kg > 0 ? `${formatWeight(prevSets[i].weight_kg)}×${prevSets[i].reps}` : `${prevSets[i].reps} Wdh.`}
              </span>
            )}
          </span>
          <form action={updateSet} style={{ display: "contents" }}>
            <input type="hidden" name="id" value={set.id} />
            <input
              className="input mono"
              name="weight_kg"
              type="number"
              min="0"
              step="0.25"
              inputMode="decimal"
              defaultValue={set.weight_kg}
              onBlur={submit}
              style={{ flex: 1, minWidth: 0, textAlign: "center", padding: "9px 4px", fontSize: 14 }}
            />
            <input
              className="input mono"
              name="reps"
              type="number"
              min="0"
              inputMode="numeric"
              defaultValue={set.reps}
              onBlur={submit}
              style={{ flex: 1, minWidth: 0, textAlign: "center", padding: "9px 4px", fontSize: 14 }}
            />
          </form>
          <button
            type="button"
            className="set-check"
            onClick={() => toggleSet(set.id)}
            aria-pressed={done.has(set.id)}
            aria-label={`Satz ${i + 1} ${done.has(set.id) ? "nicht mehr abhaken" : "abhaken und Pause starten"}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>
          </button>
          <form action={deleteSet} style={{ width: 30, display: "flex", justifyContent: "center" }}>
            <input type="hidden" name="id" value={set.id} />
            <button
              type="submit"
              className="btn ghost sm"
              title="Satz entfernen"
              style={{ padding: "0 6px", minHeight: 0, lineHeight: 1.6 }}
            >
              ✕
            </button>
          </form>
        </div>
      ))}

      <form action={addSet} style={{ marginTop: 6 }}>
        <input type="hidden" name="exercise_id" value={exercise.id} />
        <button type="submit" className="btn ghost sm" style={{ width: "100%" }}>
          + Satz
        </button>
      </form>
    </div>
  );
}
