"use client";

import { useState } from "react";
import { addExercise } from "@/lib/actions/training";
import { exerciseCatalog, exerciseKey, muscleGroups } from "@/lib/exerciseCatalog";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ExercisePicker({ sessionId, existingNames }: { sessionId: string; existingNames: string[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [error, setError] = useState("");
  const entries = [...exerciseCatalog, ...existingNames.filter(name => !exerciseCatalog.some(ex => exerciseKey(ex.name) === exerciseKey(name))).map(name => ({ name, group: "Eigene" }))];
  const results = entries.filter(ex => (!group || ex.group === group) && exerciseKey(ex.name).includes(exerciseKey(query)));

  return <details className="card exercise-picker">
    <summary>+ Übung hinzufügen</summary>
    <form action={async data => {
      setError("");
      try { await addExercise(data); setQuery(""); }
      catch { setError("Übung konnte nicht gespeichert werden. Bitte erneut versuchen."); }
    }}>
      <input type="hidden" name="session_id" value={sessionId} />
      <label htmlFor={`exercise-search-${sessionId}`}>Übung suchen oder eigenen Namen eingeben</label>
      <input id={`exercise-search-${sessionId}`} className="input" name="name" value={query} onChange={e => setQuery(e.target.value)} required maxLength={120} autoComplete="off" />
      <div className="fitness-chips" aria-label="Muskelgruppe">
        {["", ...muscleGroups, "Eigene"].map(value => <button key={value} type="button" className="btn secondary sm" aria-pressed={group === value} onClick={() => setGroup(value)}>{value || "Alle"}</button>)}
      </div>
      <div className="exercise-results">
        {results.map(ex => <button className="btn ghost" type="button" key={ex.name} onClick={() => setQuery(ex.name)} aria-pressed={query === ex.name}><span>{ex.name}</span><small>{ex.group}</small></button>)}
        {!results.length && <p>Kein Treffer. Du kannst den eingegebenen Namen als eigene Übung hinzufügen.</p>}
      </div>
      {error && <p role="alert">{error}</p>}
      <SubmitButton className="btn primary" type="submit" disabled={!query.trim()}>Übung hinzufügen</SubmitButton>
    </form>
  </details>;
}
