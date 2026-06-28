"use client";

import { useRef } from "react";
import { createMatch } from "@/lib/actions/matches";

export function MatchForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    await createMatch(formData);
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="card"
      style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        <div className="form-row">
          <label htmlFor="played_on">Datum</label>
          <input className="input mono" id="played_on" name="played_on" type="date" required />
        </div>
        <div className="form-row">
          <label htmlFor="opponent">Gegner</label>
          <input className="input" id="opponent" name="opponent" required />
        </div>
        <div className="form-row">
          <label htmlFor="goals_for">Tore (eigene)</label>
          <input className="input mono" id="goals_for" name="goals_for" type="number" min={0} defaultValue={0} />
        </div>
        <div className="form-row">
          <label htmlFor="goals_against">Tore (Gegner)</label>
          <input className="input mono" id="goals_against" name="goals_against" type="number" min={0} defaultValue={0} />
        </div>
        <div className="form-row">
          <label htmlFor="own_goals">Eigene Tore von Erik</label>
          <input className="input mono" id="own_goals" name="own_goals" type="number" min={0} defaultValue={0} />
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="note">Notiz</label>
        <input className="input" id="note" name="note" placeholder="optional" />
      </div>
      <button type="submit" className="btn primary">
        Spiel eintragen
      </button>
    </form>
  );
}
