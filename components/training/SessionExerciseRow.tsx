"use client";

import { deleteExercise, updateExercise } from "@/lib/actions/training";
import { WorkoutExerciseRow } from "@/lib/types";

/** Zeile einer Übung in einer offenen Session — speichert automatisch beim Verlassen eines Feldes. */
export function SessionExerciseRow({ ex }: { ex: WorkoutExerciseRow }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--border-subtle)" }}>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, minWidth: 0 }}>{ex.name}</span>

      <form action={updateExercise} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="hidden" name="id" value={ex.id} />
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 9, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>SÄTZE</span>
          <input
            className="input mono"
            name="sets"
            type="number"
            min="1"
            inputMode="numeric"
            defaultValue={ex.sets}
            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
            style={{ width: 48, textAlign: "center", padding: "8px 4px" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 9, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>WDH.</span>
          <input
            className="input mono"
            name="reps"
            type="number"
            min="1"
            inputMode="numeric"
            defaultValue={ex.reps}
            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
            style={{ width: 48, textAlign: "center", padding: "8px 4px" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 9, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>KG</span>
          <input
            className="input mono"
            name="weight_kg"
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            defaultValue={ex.weight_kg}
            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
            style={{ width: 64, textAlign: "center", padding: "8px 4px" }}
          />
        </label>
      </form>

      <form action={deleteExercise}>
        <input type="hidden" name="id" value={ex.id} />
        <button type="submit" className="btn ghost sm" title="Übung entfernen">
          ✕
        </button>
      </form>
    </div>
  );
}
