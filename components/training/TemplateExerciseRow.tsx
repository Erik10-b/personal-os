"use client";

import { FocusEvent } from "react";
import { deleteTemplateExercise, updateTemplateExercise } from "@/lib/actions/trainingTemplates";
import { WorkoutTemplateExerciseRow } from "@/lib/types";

const capStyle: React.CSSProperties = {
  fontSize: 9,
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};
const fieldStyle: React.CSSProperties = { flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 };
const numStyle: React.CSSProperties = { width: "100%", textAlign: "center", padding: "7px 4px", fontSize: 12 };

/** Editierbarer Block einer Vorlagen-Übung — speichert automatisch beim Verlassen eines Feldes. */
export function TemplateExerciseRow({ ex }: { ex: WorkoutTemplateExerciseRow }) {
  const submit = (e: FocusEvent<HTMLInputElement>) => e.currentTarget.form?.requestSubmit();

  return (
    <div
      style={{
        position: "relative",
        background: "var(--bg-surface-2)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "10px",
      }}
    >
      <form action={updateTemplateExercise}>
        <input type="hidden" name="id" value={ex.id} />
        <input
          className="input"
          name="name"
          defaultValue={ex.name}
          onBlur={submit}
          placeholder="Übung"
          style={{ width: "100%", marginBottom: 8, paddingRight: 26, fontSize: 12.5, fontWeight: 600 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <label style={fieldStyle}>
            <span style={capStyle}>Sätze</span>
            <input className="input mono" name="default_sets" type="number" min="1" defaultValue={ex.default_sets} onBlur={submit} style={numStyle} />
          </label>
          <label style={fieldStyle}>
            <span style={capStyle}>Wdh.</span>
            <input className="input mono" name="default_reps" type="number" min="1" defaultValue={ex.default_reps} onBlur={submit} style={numStyle} />
          </label>
          <label style={fieldStyle}>
            <span style={capStyle}>kg</span>
            <input className="input mono" name="default_weight_kg" type="number" min="0" step="0.5" defaultValue={ex.default_weight_kg} onBlur={submit} style={numStyle} />
          </label>
        </div>
      </form>

      <form action={deleteTemplateExercise} style={{ position: "absolute", top: 8, right: 8 }}>
        <input type="hidden" name="id" value={ex.id} />
        <button
          type="submit"
          className="btn ghost sm"
          title="Übung entfernen"
          style={{ padding: "0 6px", minHeight: 0, lineHeight: 1.6, fontSize: 13 }}
        >
          ✕
        </button>
      </form>
    </div>
  );
}
