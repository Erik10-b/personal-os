"use client";

import { FocusEvent } from "react";
import { addSet, deleteExercise, deleteSet, updateSet } from "@/lib/actions/training";
import { WorkoutExerciseWithSets } from "@/lib/services/training";

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
}: {
  exercise: WorkoutExerciseWithSets;
  prevSummary?: string;
}) {
  const submit = (e: FocusEvent<HTMLInputElement>) => e.currentTarget.form?.requestSubmit();
  const sets = [...exercise.sets_list].sort((a, b) => a.position - b.position);

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
        <span style={{ width: 30 }} />
      </div>

      {sets.map((set, i) => (
        <div key={set.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 4px" }}>
          <span style={{ width: 48, fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
            {i + 1}.
          </span>
          <form action={updateSet} style={{ display: "contents" }}>
            <input type="hidden" name="id" value={set.id} />
            <input
              className="input mono"
              name="weight_kg"
              type="number"
              min="0"
              step="0.5"
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
