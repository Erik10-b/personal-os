import Link from "next/link";
import { collectExerciseNames, getPersonalBests, getWorkoutSessions } from "@/lib/services/training";
import type { WorkoutSessionWithExercises } from "@/lib/services/training";
import { getTemplates } from "@/lib/services/trainingTemplates";
import type { WorkoutTemplateWithExercises } from "@/lib/services/trainingTemplates";
import { addExercise, completeSession, deleteSession, reopenSession, startSession } from "@/lib/actions/training";
import { addTemplateExercise, createTemplate, deleteTemplate } from "@/lib/actions/trainingTemplates";
import { EmptyState } from "@/components/ui/Card";
import { TrainingProgress } from "@/components/training/TrainingProgress";
import { SessionExerciseCard } from "@/components/training/SessionExerciseCard";
import { SessionNote } from "@/components/training/SessionNote";
import { TemplateExerciseList } from "@/components/training/TemplateExerciseList";
import { formatSetsSummary, formatWeight, lastPerformanceByName } from "@/lib/trainingUtils";
import type { PersonalBest } from "@/lib/services/training";

type Tab = "log" | "verlauf" | "fortschritt" | "vorlagen";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab: Tab =
    rawTab === "verlauf" || rawTab === "fortschritt" || rawTab === "vorlagen" ? rawTab : "log";

  const today = new Date().toISOString().slice(0, 10);
  const [sessions, templates] = await Promise.all([getWorkoutSessions(150), getTemplates()]);

  const openSessions = sessions.filter((s) => !s.completed_at);
  const doneSessions = sessions.filter((s) => s.completed_at);

  const TABS: { key: Tab; label: string }[] = [
    { key: "log", label: openSessions.length > 0 ? "Aktiv" : "Start" },
    { key: "verlauf", label: "Verlauf" },
    { key: "fortschritt", label: "Fortschritt" },
    { key: "vorlagen", label: "Vorlagen" },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Training</h1>
          <p>
            {doneSessions.length} Sessions · zuletzt{" "}
            {doneSessions[0] ? formatDate(doneSessions[0].session_date) : "–"}
          </p>
        </div>
      </div>

      <div className="pill-tabs" style={{ marginBottom: "var(--space-5)" }}>
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/training?tab=${t.key}`}
            className={`pill-tab ${tab === t.key ? "active club" : ""}`}
          >
            {t.label}
            {t.key === "log" && openSessions.length > 0 && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--success)",
                  boxShadow: "0 0 6px var(--success)",
                }}
              />
            )}
          </Link>
        ))}
      </div>

      {tab === "log" && (
        <LogTab
          sessions={sessions}
          doneSessions={doneSessions}
          openSessions={openSessions}
          templates={templates}
          today={today}
        />
      )}
      {tab === "verlauf" && <VerlaufTab doneSessions={doneSessions} />}
      {tab === "fortschritt" && (
        <FortschrittTab doneSessions={doneSessions} bests={getPersonalBests(sessions)} />
      )}
      {tab === "vorlagen" && <VorlagenTab templates={templates} />}
    </>
  );
}

/* ===================== TAB: Training (Start / Aktiv) ===================== */

function LogTab({
  sessions,
  doneSessions,
  openSessions,
  templates,
  today,
}: {
  sessions: WorkoutSessionWithExercises[];
  doneSessions: WorkoutSessionWithExercises[];
  openSessions: WorkoutSessionWithExercises[];
  templates: WorkoutTemplateWithExercises[];
  today: string;
}) {
  const templateNames = templates.flatMap((t) => t.exercises.map((e) => e.name));
  const exerciseNames = collectExerciseNames(sessions, templateNames);
  const lastByName = lastPerformanceByName(doneSessions);

  if (openSessions.length === 0) {
    return (
      <>
        <span className="habit-section-label">SESSION STARTEN</span>
        <div className="start-grid" style={{ marginBottom: "var(--space-5)" }}>
          {templates.map((t) => (
            <form key={t.id} action={startSession}>
              <input type="hidden" name="template_id" value={t.id} />
              <input type="hidden" name="session_date" value={today} />
              <button type="submit" className="start-card-btn">
                <span className="start-card-name">{t.name}</span>
                <span className="start-card-meta">
                  {t.exercises.length} Übungen · {t.exercises.slice(0, 3).map((e) => e.name).join(", ")}
                  {t.exercises.length > 3 ? " …" : ""}
                </span>
              </button>
            </form>
          ))}
        </div>

        <details className="card">
          <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--text-secondary)" }}>
            Freies Training oder anderes Datum
          </summary>
          <form
            action={startSession}
            style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap", marginTop: "var(--space-4)" }}
          >
            <div className="form-row" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="template_id">Vorlage</label>
              <select className="input" id="template_id" name="template_id" defaultValue="">
                <option value="">Freies Training (leer)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="session_date">Datum</label>
              <input className="input mono" id="session_date" name="session_date" type="date" defaultValue={today} required />
            </div>
            <button type="submit" className="btn secondary">
              Starten
            </button>
          </form>
        </details>
      </>
    );
  }

  return (
    <>
      {openSessions.map((session) => (
        <div key={session.id} style={{ marginBottom: "var(--space-6)" }}>
          <div className="card" style={{ borderColor: "var(--border-club)", paddingBottom: "var(--space-4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{session.title || "Training"}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                  {formatDate(session.session_date)} · {session.exercises.length} Übungen
                </div>
              </div>
              <form action={deleteSession}>
                <input type="hidden" name="id" value={session.id} />
                <button type="submit" className="btn ghost sm">
                  Verwerfen
                </button>
              </form>
            </div>

            {session.exercises.length === 0 ? (
              <EmptyState>Noch keine Übungen — füge unten welche hinzu.</EmptyState>
            ) : (
              session.exercises.map((ex) => (
                <SessionExerciseCard key={ex.id} exercise={ex} prevSummary={lastByName.get(ex.name)} />
              ))
            )}

            <form
              action={addExercise}
              style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end", flexWrap: "wrap", marginTop: "var(--space-3)" }}
            >
              <input type="hidden" name="session_id" value={session.id} />
              <div className="form-row" style={{ flex: 1, minWidth: 160 }}>
                <label>Übung hinzufügen</label>
                <input className="input" name="name" placeholder="Übung wählen/eingeben" list="exercise-names" required />
              </div>
              <button type="submit" className="btn secondary sm">
                + Übung
              </button>
            </form>

            <SessionNote sessionId={session.id} note={session.note} />
          </div>

          <div className="session-actionbar">
            <form action={completeSession} style={{ flex: 1, display: "flex" }}>
              <input type="hidden" name="id" value={session.id} />
              <button type="submit" className="btn primary" style={{ flex: 1, minHeight: 46 }}>
                ✓ Training abschließen
              </button>
            </form>
          </div>
        </div>
      ))}

      <datalist id="exercise-names">
        {exerciseNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}

/* ===================== TAB: Verlauf ===================== */

function VerlaufTab({ doneSessions }: { doneSessions: WorkoutSessionWithExercises[] }) {
  const groupsMap = new Map<string, WorkoutSessionWithExercises[]>();
  for (const s of doneSessions) {
    const key = s.title || "Sonstige";
    const list = groupsMap.get(key) ?? [];
    list.push(s);
    groupsMap.set(key, list);
  }
  const doneGroups = Array.from(groupsMap.entries()).sort((a, b) =>
    (b[1][0]?.session_date ?? "").localeCompare(a[1][0]?.session_date ?? "")
  );

  if (doneSessions.length === 0) {
    return <EmptyState>Noch keine abgeschlossenen Sessions.</EmptyState>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {doneGroups.map(([category, groupSessions]) => (
        <details key={category} className="card">
          <summary style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{category}</span>
            <span className="badge neutral mono">{groupSessions.length}</span>
          </summary>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
            {groupSessions.map((session) => (
              <div key={session.id} style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-3)" }}>
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
                        <th>Sätze (kg×Wdh.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.exercises.map((ex) => (
                        <tr key={ex.id}>
                          <td>{ex.name}</td>
                          <td className="mono">{formatSetsSummary(ex)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

/* ===================== TAB: Fortschritt ===================== */

function FortschrittTab({
  doneSessions,
  bests,
}: {
  doneSessions: WorkoutSessionWithExercises[];
  bests: PersonalBest[];
}) {
  if (doneSessions.length === 0) {
    return <EmptyState>Noch keine Daten — schließe zuerst eine Session ab.</EmptyState>;
  }

  return (
    <>
      <TrainingProgress sessions={doneSessions} />
      <div className="card">
        <span className="habit-section-label">BESTLEISTUNGEN</span>
        <ul className="habit-ranking">
          {bests.map((b) => (
            <li key={b.name} className="habit-rank-item">
              <span className="habit-rank-name">{b.name}</span>
              <span className="habit-rank-pct">
                {formatWeight(b.weight_kg)} kg × {b.reps}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* ===================== TAB: Vorlagen ===================== */

function VorlagenTab({ templates }: { templates: WorkoutTemplateWithExercises[] }) {
  return (
    <div className="module-grid">
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
                Ziehe am Griff, um Übungen umzusortieren. Änderungen werden automatisch gespeichert.
              </div>
              <TemplateExerciseList templateId={template.id} exercises={template.exercises} />

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
                    <input className="input mono" name="default_sets" type="number" min="1" defaultValue={2} style={{ width: "100%", textAlign: "center", padding: "7px 4px", fontSize: 12 }} />
                  </label>
                  <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 9, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Wdh.</span>
                    <input className="input mono" name="default_reps" type="number" min="1" defaultValue={8} style={{ width: "100%", textAlign: "center", padding: "7px 4px", fontSize: 12 }} />
                  </label>
                  <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 9, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>kg</span>
                    <input className="input mono" name="default_weight_kg" type="number" min="0" step="0.25" defaultValue={0} style={{ width: "100%", textAlign: "center", padding: "7px 4px", fontSize: 12 }} />
                  </label>
                  <button type="submit" className="btn secondary sm" style={{ flexShrink: 0 }}>
                    +
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
  );
}
