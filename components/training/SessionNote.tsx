"use client";

import { FocusEvent } from "react";
import { updateSessionNote } from "@/lib/actions/training";

export function SessionNote({ sessionId, note }: { sessionId: string; note: string | null }) {
  const submit = (e: FocusEvent<HTMLTextAreaElement>) => e.currentTarget.form?.requestSubmit();

  return (
    <form action={updateSessionNote} style={{ marginTop: "var(--space-3)" }}>
      <input type="hidden" name="id" value={sessionId} />
      <label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: 4 }}>
        Notiz
      </label>
      <textarea
        className="input"
        name="note"
        defaultValue={note ?? ""}
        onBlur={submit}
        placeholder="z.B. Knie zwickt, guter Pump…"
        rows={2}
        style={{ width: "100%", resize: "vertical", fontSize: 12.5 }}
      />
    </form>
  );
}
