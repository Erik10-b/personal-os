"use client";

import { FocusEvent, PointerEvent, useEffect, useRef, useState } from "react";
import {
  deleteTemplateExercise,
  reorderTemplateExercises,
  updateTemplateExercise,
} from "@/lib/actions/trainingTemplates";
import { WorkoutTemplateExerciseRow } from "@/lib/types";

const numStyle: React.CSSProperties = {
  width: 34,
  flexShrink: 0,
  textAlign: "center",
  padding: "6px 2px",
  fontSize: 12,
};
const sepStyle: React.CSSProperties = { fontSize: 10, color: "var(--text-tertiary)", flexShrink: 0 };

/** Editierbare, per Drag & Drop sortierbare Übungsliste einer Vorlage. */
export function TemplateExerciseList({
  templateId,
  exercises,
}: {
  templateId: string;
  exercises: WorkoutTemplateExerciseRow[];
}) {
  const [items, setItems] = useState(exercises);
  useEffect(() => setItems(exercises), [exercises]);

  const dragId = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dirty = useRef(false);

  const submit = (e: FocusEvent<HTMLInputElement>) => e.currentTarget.form?.requestSubmit();

  function moveOver(overId: string) {
    if (!dragId.current || dragId.current === overId) return;
    setItems((prev) => {
      const from = prev.findIndex((e) => e.id === dragId.current);
      const to = prev.findIndex((e) => e.id === overId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
    dirty.current = true;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!dragId.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const row = el?.closest<HTMLElement>("[data-row-id]");
    if (row?.dataset.rowId) moveOver(row.dataset.rowId);
  }

  function endDrag() {
    dragId.current = null;
    setDraggingId(null);
    if (dirty.current) {
      dirty.current = false;
      reorderTemplateExercises(items.map((e) => e.id));
    }
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 6 }}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {items.map((ex) => (
        <div
          key={ex.id}
          data-row-id={ex.id}
          style={{
            position: "relative",
            display: "flex",
            gap: 6,
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "8px 10px",
            opacity: draggingId === ex.id ? 0.45 : 1,
          }}
        >
          <span
            onPointerDown={(e) => {
              e.preventDefault();
              dragId.current = ex.id;
              setDraggingId(ex.id);
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }}
            style={{
              alignSelf: "stretch",
              display: "flex",
              alignItems: "center",
              cursor: "grab",
              color: "var(--text-tertiary)",
              fontSize: 15,
              lineHeight: 1,
              padding: "0 4px",
              touchAction: "none",
              userSelect: "none",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            ⠿
          </span>

          <form
            action={updateTemplateExercise}
            style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, paddingRight: 26 }}
          >
            <input type="hidden" name="id" value={ex.id} />
            <input
              className="input"
              name="name"
              defaultValue={ex.name}
              onBlur={submit}
              placeholder="Übung"
              style={{ width: "100%", fontSize: 12.5, fontWeight: 600, padding: "6px 8px" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                className="input mono"
                name="default_sets"
                type="number"
                min="1"
                defaultValue={ex.default_sets}
                onBlur={submit}
                style={numStyle}
                title="Sätze"
              />
              <span style={sepStyle}>×</span>
              <input
                className="input mono"
                name="default_reps"
                type="number"
                min="1"
                defaultValue={ex.default_reps}
                onBlur={submit}
                style={numStyle}
                title="Wdh."
              />
              <span style={sepStyle}>@</span>
              <input
                className="input mono"
                name="default_weight_kg"
                type="number"
                min="0"
                step="0.25"
                defaultValue={ex.default_weight_kg}
                onBlur={submit}
                style={{ ...numStyle, width: 48 }}
                title="kg"
              />
            </div>
          </form>

          <form action={deleteTemplateExercise} style={{ position: "absolute", top: 8, right: 8 }}>
            <input type="hidden" name="id" value={ex.id} />
            <button
              type="submit"
              className="btn ghost sm"
              title="Übung entfernen"
              style={{ padding: "0 4px", minHeight: 0, lineHeight: 1.6, fontSize: 13, flexShrink: 0 }}
            >
              ✕
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
