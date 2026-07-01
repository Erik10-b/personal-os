import { getPersonalBests, getWorkoutSessions } from "@/lib/services/training";
import { getTemplates } from "@/lib/services/trainingTemplates";
import { addExercise, createSession, deleteExercise, deleteSession, updateExercise } from "@/lib/actions/training";
import {
  addTemplateExercise,
  createSessionFromTemplate,
  createTemplate,
  deleteTemplate,
  deleteTemplateExercise,
} from "@/lib/actions/trainingTemplates";
import { EmptyState } from "@/components/ui/Card";

function formatWeight(kg: number) {
  return kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1);
}

export default async function TrainingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [sessions, templates] = await Promise.all([getWorkoutSessions(100), getTemplates()]);
  const bests = getPersonalBests(sessions);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Training</h1>
          <p>Trainingsfortschritt festhalten — Übung, Sätze, Wiederholungen, Gewicht.</p>
        </div>
      </div>

      {/* ===== Vorlagen ===== */}
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 var(--space-4)" }}>Vorlagen</h2>
      <div className="module-grid" style={{ marginBottom: "var(--space-4)" }}>
        {templates.map((template) => (
          <div key={template.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{template.name}</div>
              <form action={deleteTemplate}>
                <input type="hidden" name="id" value={template.id} />
                <button type="submit" className="btn ghost sm">
                  Löschen
                </button>
              </form>
            </div>

            {template.exercises.length > 0 && (
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 4, marginBottom: "var(--space-3)" }}>
                {template.exercises.map((ex) => (
                  <li key={ex.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: 12 }}>
                    <span style={{ flex: 1 }}>{ex.name}</span>
                    <span className="badge neutral mono">
                      {ex.default_sets}×{ex.default_reps} @ {formatWeight(ex.default_weight_kg)}kg
                    </span>
                    <form action={deleteTemplateExercise}>
                      <input type="hidden" name="id" value={ex.id} />
                      <button type="submit" className="btn ghost sm">
                        ✕
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form
              action={addTemplateExercise}
              style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: "var(--space-3)" }}
            >
              <input type="hidden" name="template_id" value={template.id} />
              <input className="input" name="name" placeholder="Übung" required style={{ flex: 1, minWidth: 100, fontSize: 11 }} />
              <input className="input mono" name="default_sets" type="number" min="1" defaultValue={3} style={{ width: 44, fontSize: 11 }} />
              <input className="input mono" name="default_reps" type="number" min="1" defaultValue={8} style={{ width: 44, fontSize: 11 }} />
              <input className="input mono" name="default_weight_kg" type="number" min="0" step="0.5" defaultValue={0} style={{ width: 56, fontSize: 11 }} />
              <button type="submit" className="btn ghost sm">
                +
              </button>
            </form>

            <form action={createSessionFromTemplate} style={{ display: "flex", gap: "var(--space-2)" }}>
              <input type="hidden" name="template_id" value={template.id} />
              <input className="input mono" name="session_date" type="date" defaultValue={today} style={{ flex: 1 }} />
              <button type="submit" className="btn primary sm">
                Session starten
              </button>
            </form>
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

      {/* ===== Neue Session (frei, ohne Vorlage) ===== */}
      <form
        action={createSession}
        className="card"
        style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", marginBottom: "var(--space-6)", flexWrap: "wrap" }}
      >
        <div className="form-row">
          <label htmlFor="session_date">Datum</label>
          <input className="input mono" id="session_date" name="session_date" type="date" defaultValue={today} required />
        </div>
        <div className="form-row" style={{ flex: 1, minWidth: 160 }}>
          <label htmlFor="session_title">Titel</label>
          <input className="input" id="session_title" name="title" placeholder="z.B. Push Day" />
        </div>
        <div className="form-row" style={{ flex: 2, minWidth: 200 }}>
          <label htmlFor="session_note">Notiz</label>
          <input className="input" id="session_note" name="note" placeholder="optional" />
        </div>
        <button type="submit" className="btn primary">
          Session anlegen
        </button>
      </form>

      <div className="habit-dash-bottom">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
          {sessions.length === 0 ? (
            <EmptyState>Noch keine Trainings-Sessions angelegt.</EmptyState>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {session.title || "Training"}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                      {new Date(session.session_date + "T00:00:00").toLocaleDateString("de-DE", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                    {session.note && (
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{session.note}</div>
                    )}
                  </div>
                  <form action={deleteSession}>
                    <input type="hidden" name="id" value={session.id} />
                    <button type="submit" className="btn ghost sm">
                      Session löschen
                    </button>
                  </form>
                </div>

                {session.exercises.length > 0 && (
                  <table className="k-table" style={{ marginBottom: "var(--space-4)" }}>
                    <thead>
                      <tr>
                        <th>Übung</th>
                        <th>Sätze</th>
                        <th>Wdh.</th>
                        <th>Gewicht (kg)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.exercises.map((ex) => (
                        <tr key={ex.id}>
                          <td>{ex.name}</td>
                          <td colSpan={3}>
                            <form
                              action={updateExercise}
                              style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "flex-end" }}
                            >
                              <input type="hidden" name="id" value={ex.id} />
                              <input className="input mono" name="sets" type="number" min="1" defaultValue={ex.sets} style={{ width: 44, fontSize: 11 }} />
                              <input className="input mono" name="reps" type="number" min="1" defaultValue={ex.reps} style={{ width: 44, fontSize: 11 }} />
                              <input
                                className="input mono"
                                name="weight_kg"
                                type="number"
                                min="0"
                                step="0.5"
                                defaultValue={ex.weight_kg}
                                style={{ width: 60, fontSize: 11 }}
                              />
                              <button type="submit" className="btn ghost sm" title="Speichern">
                                ✓
                              </button>
                            </form>
                          </td>
                          <td className="right">
                            <form action={deleteExercise}>
                              <input type="hidden" name="id" value={ex.id} />
                              <button type="submit" className="btn ghost sm">
                                ✕
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <form
                  action={addExercise}
                  style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end", flexWrap: "wrap" }}
                >
                  <input type="hidden" name="session_id" value={session.id} />
                  <div className="form-row" style={{ flex: 2, minWidth: 140 }}>
                    <label>Übung</label>
                    <input className="input" name="name" placeholder="z.B. Bankdrücken" required />
                  </div>
                  <div className="form-row" style={{ maxWidth: 80 }}>
                    <label>Sätze</label>
                    <input className="input mono" name="sets" type="number" min="1" defaultValue={3} required />
                  </div>
                  <div className="form-row" style={{ maxWidth: 80 }}>
                    <label>Wdh.</label>
                    <input className="input mono" name="reps" type="number" min="1" defaultValue={8} required />
                  </div>
                  <div className="form-row" style={{ maxWidth: 100 }}>
                    <label>Gewicht (kg)</label>
                    <input className="input mono" name="weight_kg" type="number" min="0" step="0.5" defaultValue={0} required />
                  </div>
                  <button type="submit" className="btn secondary sm">
                    + Übung
                  </button>
                </form>
              </div>
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
