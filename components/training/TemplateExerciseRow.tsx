"use client";

import { deleteTemplateExercise, updateTemplateExercise } from "@/lib/actions/trainingTemplates";
import { WorkoutTemplateExerciseRow } from "@/lib/types";

/** Editierbare Zeile einer Vorlagen-Übung — speichert automatisch beim Verlassen eines Feldes. */
export function TemplateExerciseRow({ ex }: { ex: WorkoutTemplateExerciseRow }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <form
        action={updateTemplateExercise}
        style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, flexWrap: "wrap" }}
      >
        <input type="hidden" name="id" value={ex.id} />
        <input
          className="input"
          name="name"
          defaultValue={ex.name}
          onBlur={(e) => e.currentTarget.form?.requestSubmit()}
          style={{ flex: 1, minWidth: 80, fontSize: 11 }}
        />
        <input
          className="input mono"
          name="default_sets"
          type="number"
          min="1"
          defaultValue={ex.default_sets}
          onBlur={(e) => e.currentTarget.form?.requestSubmit()}
          style={{ width: 38, fontSize: 11 }}
        />
        <input
          className="input mono"
          name="default_reps"
          type="number"
          min="1"
          defaultValue={ex.default_reps}
          onBlur={(e) => e.currentTarget.form?.requestSubmit()}
          style={{ width: 38, fontSize: 11 }}
        />
        <input
          className="input mono"
          name="default_weight_kg"
          type="number"
          min="0"
          step="0.5"
          defaultValue={ex.default_weight_kg}
          onBlur={(e) => e.currentTarget.form?.requestSubmit()}
          style={{ width: 50, fontSize: 11 }}
        />
      </form>
      <form action={deleteTemplateExercise}>
        <input type="hidden" name="id" value={ex.id} />
        <button type="submit" className="btn ghost sm" title="Übung entfernen">
          ✕
        </button>
      </form>
    </div>
  );
}
