import { getPersonalBests, getWorkoutSessions } from "@/lib/services/training";
import { getTemplates } from "@/lib/services/trainingTemplates";
import {
  addExercise,
  completeSession,
  deleteSession,
  reopenSession,
  startSession,
} from "@/lib/actions/training";
import { addTemplateExercise, createTemplate, deleteTemplate } from "@/lib/actions/trainingTemplates";
import { EmptyState } from "@/components/ui/Card";
import { TrainingProgress } from "@/components/training/TrainingProgress";
import { SessionExerciseRow } from "@/components/training/SessionExerciseRow";
import { TemplateExerciseRow } from "@/components/training/TemplateExerciseRow";

function formatWeight(kg: number) {
  return kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function TrainingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [sessions, templates] = await Promise.all([getWorkoutSessions(100), getTemplates()]);
  const bests = getPersonalBests(sessions);

  const openSessions = sessions.filter((s) => !s.completed_at);
  const doneSessions = sessions.filter((s) => s.completed_at);

  // Verlauf nach Kategorie (Titel) gruppieren, jüngste Kategorie zuerst
  const groupsMap = new Map<string, typeof doneSessions>();
  for (const s of doneSessions) {
    const key = s.title || "Sonstige";
    const list = groupsMap.get(key) ?? [];
    list.push(s);
    groupsMap.set(key, list);
  }
  const doneGroups = Array.from(groupsMap.entries()).sort((a, b) =>
    (b[1][0]?.session_date ?? "").localeCompare(a[1][0]?.session_date ?? "")
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Training</h1>
          <p>Session starten, Werte pro Übung eintragen, am Ende abschließen.</p>
        </div>
      </div>

      {/* ===== Session starten ===== */}
      <form
        action={startSession}
        className="card"
        style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", marginBottom: "var(--space-6)", flexWrap: "wrap" }}
      >
        <div className="form-row" style={{ flex: 1, minWidth: 180 }}>
          <label htmlFor="template_id">Vorlage</label>
          <select className="input" id="template_id" name="template_id" defaultValue={templates[0]?.id ?? ""}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
            <option value="">Freies Training (ohne Vorlage)</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="session_date">Datum</label>
          <input className="input mono" id="session_date" name="session_date" type="date" defaultValue={today} required />
        </div>
        <button type="submit" className="btn primary">
          Session starten
        </button>
      </form>

      {/* ===== Offene Session(s) ===== */}
      {openSessions.length > 0 && (
        <div style={{ marginBottom: "var(--space-8)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 var(--space-4)" }}>Aktives Training</h2>
          {openSessions.map((session) => (
            <div key={session.id} className="card" style={{ marginBottom: "var(--space-4)", borderColor: "var(--border-club)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{session.title || "Training"}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                    {formatDate(session.session_date)} · offen
                  </div>
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <form action={completeSession}>
                    <input type="hidden" name="id" value={session.id} />
                    <button type="submit" className="btn primary sm">
                      ✓ Abschließen
                    </button>
                  </form>
                  <form action={deleteSession}>
                    <input type="hidden" name="id" value={session.id} />
                    <button type="submit" className="btn ghost sm">
                      Verwerfen
                    </button>
                  </form>
                </div>
              </div>

              {session.exercises.length === 0 ? (
                <EmptyState>Noch keine Übungen — füge unten welche hinzu.</EmptyState>
              ) : (
                <div style={{ marginBottom: "var(--space-4)" }}>
                  {session.exercises.map((ex) => (
                    <SessionExerciseRow key={ex.id} ex={ex} />
                  ))}
                </div>
              )}

              <form action={addExercise} style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end", flexWrap: "wrap" }}>
                <input type="hidden" name="session_id" value={session.id} />
                <div className="form-row" style={{ flex: 2, minWidth: 140 }}>
                  <label>Übung hinzufügen</label>
                  <input className="input" name="name" placeholder="z.B. Bankdrücken" required />
                </div>
                <div className="form-row" style={{ maxWidth: 70 }}>
                  <label>Sätze</label>
                  <input className="input mono" name="sets" type="number" min="1" defaultValue={3} required />
                </div>
                <div className="form-row" style={{ maxWidth: 70 }}>
                  <label>Wdh.</label>
                  <input className="input mono" name="reps" type="number" min="1" defaultValue={8} required />
                </div>
                <div className="form-row" style={{ maxWidth: 90 }}>
                  <label>Gewicht (kg)</label>
                  <input className="input mono" name="weight_kg" type="number" min="0" step="0.5" defaultValue={0} required />
                </div>
                <button type="submit" className="btn secondary sm">
                  + Übung
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* ===== Vorlagen (feste Anzeige, Bearbeiten einklappbar) ===== */}
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 var(--space-4)" }}>Vorlagen</h2>
      <div className="module-grid" style={{ marginBottom: "var(--space-8)" }}>
        {templates.map((template) => (
          <div key={template.id} className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: "var(--space-3)" }}>{template.name}</div>

            {template.exercises.length === 0 ? (
              <EmptyState>Keine Übungen hinterlegt.</EmptyState>
            ) : (
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6, marginBottom: "var(--space-3)" }}>
                {template.exercises.map((ex) => (
                  <li key={ex.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: 12.5 }}>
                    <span style={{ flex: 1 }}>{ex.name}</span>
                    <span className="badge neutral mono">
                      {ex.default_sets}×{ex.default_reps} @ {formatWeight(ex.default_weight_kg)}kg
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <details>
              <summary style={{ cursor: "pointer", fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                Bearbeiten
              </summary>
              <div style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                  Änderungen werden automatisch gespeichert.
                </div>
                {template.exercises.map((ex) => (
                  <TemplateExerciseRow key={ex.id} ex={ex} />
                ))}

                <form
                  action={addTemplateExercise}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginTop: 4,
                    padding: 10,
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed var(--border-subtle)",
                  }}
                >
                  <input type="hidden" name="template_id" value={template.id} />
                  <input className="input" name="name" placeholder="Neue Übung" required style={{ width: "100%", fontSize: 12.5 }} />
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 9, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Sätze</span>
                      <input className="input mono" name="default_sets" type="number" min="1" defaultValue={3} style={{ width: "100%", textAlign: "center", padding: "7px 4px", fontSize: 12 }} />
                    </label>
                    <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 9, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Wdh.</span>
                      <input className="input mono" name="default_reps" type="number" min="1" defaultValue={8} style={{ width: "100%", textAlign: "center", padding: "7px 4px", fontSize: 12 }} />
                    </label>
                    <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 9, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>kg</span>
                      <input className="input mono" name="default_weight_kg" type="number" min="0" step="0.5" defaultValue={0} style={{ width: "100%", textAlign: "center", padding: "7px 4px", fontSize: 12 }} />
                    </label>
                    <button type="submit" className="btn secondary sm" style={{ flexShrink: 0 }}>
                      + Übung
                    </button>
                  </div>
                </form>

                <form action={deleteTemplate} style={{ marginTop: 4 }}>
                  <input type="hidden" name="id" value={template.id} />
                  <button type="submit" className="btn ghost sm" style={{ color: "var(--danger)" }}>
                    Vorlage löschen
                  </button>
                </form>
              </div>
            </details>
          </div>
        ))}

        <form action={createTemplate} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", justifyContent: "center" }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Neue Vorlage</label>
          <input className="input" name="name" placeholder="z.B. Torso 1" required />
          <button type="submit" className="btn secondary sm">
            Anlegen
          </button>
        </form>
      </div>

      {/* ===== Verlauf ===== */}
      {doneSessions.length > 0 && <TrainingProgress sessions={doneSessions} />}

      {/* ===== Historie + Bestleistungen ===== */}
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 var(--space-4)" }}>Verlauf</h2>
      <div className="habit-dash-bottom">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", minWidth: 0 }}>
          {doneSessions.length === 0 ? (
            <EmptyState>Noch keine abgeschlossenen Sessions.</EmptyState>
          ) : (
            doneGroups.map(([category, groupSessions]) => (
              <details key={category} className="card">
                <summary style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{category}</span>
                  <span className="badge neutral mono">{groupSessions.length}</span>
                </summary>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                  {groupSessions.map((session) => (
                    <div
                      key={session.id}
                      style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-3)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                            {formatDate(session.session_date)}
                          </div>
                          {session.note && (
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{session.note}</div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "var(--space-2)" }}>
                          <form action={reopenSession}>
                            <input type="hidden" name="id" value={session.id} />
                            <button type="submit" className="btn ghost sm">
                              Bearbeiten
                            </button>
                          </form>
                          <form action={deleteSession}>
                            <input type="hidden" name="id" value={session.id} />
                            <button type="submit" className="btn ghost sm">
                              ✕
                            </button>
                          </form>
                        </div>
                      </div>

                      {session.exercises.length > 0 && (
                        <table className="k-table">
                          <thead>
                            <tr>
                              <th>Übung</th>
                              <th>Sätze</th>
                              <th>Wdh.</th>
                              <th>Gewicht</th>
                            </tr>
                          </thead>
                          <tbody>
                            {session.exercises.map((ex) => (
                              <tr key={ex.id}>
                                <td>{ex.name}</td>
                                <td className="mono">{ex.sets}</td>
                                <td className="mono">{ex.reps}</td>
                                <td className="mono">{formatWeight(ex.weight_kg)} kg</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            ))
          )}
        </div>

        <div className="card">
          <span className="habit-section-label">BESTLEISTUNGEN</span>
          {bests.length === 0 ? (
            <EmptyState>Noch keine Übungen erfasst.</EmptyState>
          ) : (
            <ul className="habit-ranking">
              {bests.map((b) => (
                <li key={b.name} className="habit-rank-item">
                  <span className="habit-rank-name">{b.name}</span>
                  <span className="habit-rank-pct">{formatWeight(b.weight_kg)} kg × {b.reps}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
