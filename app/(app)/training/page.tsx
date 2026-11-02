import { SubmitButton } from "@/components/ui/SubmitButton";
import { localDateKey } from "@/lib/dateUtils";
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
import { formatDelta, formatVolume, sessionInsights } from "@/lib/trainingInsights";
import type { SessionInsights } from "@/lib/trainingInsights";
import { sessionShareCard } from "@/lib/shareCardData";
import { ShareCardButton } from "@/components/share/ShareCardButton";
import { RestTimer } from "@/components/training/RestTimer";
import { bestOneRepMax, lastSetsByName, recentWeeks, relativeDay, suggestNext, weekStreak } from "@/lib/trainingCoach";

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

  const today = localDateKey();
  const [sessions, templates] = await Promise.all([getWorkoutSessions(150), getTemplates()]);

  const openSessions = sessions.filter((s) => !s.completed_at);
  const doneSessions = sessions.filter((s) => s.completed_at);
  const streak = weekStreak(doneSessions.map((s) => s.session_date), today);
  // doneSessions ist jüngste zuerst — alles danach ist älter und dient als Vergleich.
  const insightsById = new Map(doneSessions.map((s, i) => [s.id, sessionInsights(s, doneSessions.slice(i + 1))]));

  // Empfehlung: die Vorlage, die am längsten nicht dran war (nie gemacht zuerst).
  const lastDoneByTitle = new Map<string, string>();
  for (const s of doneSessions) if (s.title && !lastDoneByTitle.has(s.title)) lastDoneByTitle.set(s.title, s.session_date);
  const recommended = [...templates].sort((a, b) =>
    (lastDoneByTitle.get(a.name) ?? "").localeCompare(lastDoneByTitle.get(b.name) ?? "")
  )[0];
  const trainedToday = doneSessions.some((s) => s.session_date === today);

  const headline = openSessions[0]
    ? `${openSessions[0].title || "Training"} läuft.`
    : trainedToday
      ? "Heute erledigt."
      : recommended
        ? `Heute ${recommended.name}?`
        : "Zeit fürs Training?";

  const TABS: { key: Tab; label: string }[] = [
    { key: "log", label: openSessions.length > 0 ? "Aktiv" : "Übersicht" },
    { key: "verlauf", label: "Verlauf" },
    { key: "fortschritt", label: "Fortschritt" },
    { key: "vorlagen", label: "Vorlagen" },
  ];

  return (
    <div className="neka-dashboard tr-page">
      <header className="neka-top tr-top">
        <div className="neka-welcome">
          <span>Training</span>
          <h1>{headline}</h1>
          <p>
            {doneSessions.length} Trainings
            {doneSessions[0] ? ` · zuletzt ${relativeDay(doneSessions[0].session_date, today)}` : ""}
          </p>
        </div>
        {streak.weeks > 0 && (tab !== "log" || openSessions.length > 0) && (
          <div className="training-streak" title="Wochen in Folge mit mindestens einem Training. Ruhetage brechen die Serie nicht.">
            <strong>{streak.weeks}</strong>
            <span>{streak.weeks === 1 ? "Woche" : "Wochen"} in Folge<small>{streak.thisWeek > 0 ? `${streak.thisWeek}× diese Woche` : "diese Woche noch offen"}</small></span>
          </div>
        )}
      </header>

      <nav className="tr-tabs" aria-label="Training-Bereiche">
        {TABS.map((t) => (
          <Link key={t.key} href={`/training?tab=${t.key}`} className={tab === t.key ? "active" : undefined} aria-current={tab === t.key ? "page" : undefined}>
            {t.label}
            {t.key === "log" && openSessions.length > 0 && <i className="tr-live-dot" aria-label="Session läuft" />}
          </Link>
        ))}
      </nav>

      {tab === "log" && (
        openSessions.length > 0 ? (
          <ActiveSessions sessions={sessions} doneSessions={doneSessions} openSessions={openSessions} templates={templates} />
        ) : (
          <Overview
            doneSessions={doneSessions}
            templates={templates}
            today={today}
            insightsById={insightsById}
            recommendedId={trainedToday ? undefined : recommended?.id}
            lastDoneByTitle={lastDoneByTitle}
          />
        )
      )}
      {tab === "verlauf" && <VerlaufTab doneSessions={doneSessions} insightsById={insightsById} />}
      {tab === "fortschritt" && (
        <FortschrittTab doneSessions={doneSessions} bests={getPersonalBests(sessions)} />
      )}
      {tab === "vorlagen" && <VorlagenTab templates={templates} />}
    </div>
  );
}

/* ===================== Übersicht (keine Session aktiv) ===================== */

function Overview({
  doneSessions,
  templates,
  today,
  insightsById,
  recommendedId,
  lastDoneByTitle,
}: {
  doneSessions: WorkoutSessionWithExercises[];
  templates: WorkoutTemplateWithExercises[];
  today: string;
  insightsById: Map<string, SessionInsights>;
  recommendedId?: string;
  lastDoneByTitle: Map<string, string>;
}) {
  const dates = doneSessions.map((s) => s.session_date);
  const streak = weekStreak(dates, today);
  const weeks = recentWeeks(dates, today, 8);

  const weekStartIso = (() => {
    const d = new Date(today + "T00:00:00");
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return localDateKey(d);
  })();
  const thisWeek = doneSessions.filter((s) => s.session_date >= weekStartIso);
  const weekVolume = formatVolume(thisWeek.reduce((sum, s) => sum + (insightsById.get(s.id)?.volumeKg ?? 0), 0));

  const last = doneSessions[0];
  const lastInsights = last ? insightsById.get(last.id) : undefined;
  const lastVolume = lastInsights ? formatVolume(lastInsights.volumeKg) : null;

  let strongest: { name: string; e1rm: number } | null = null;
  for (const s of doneSessions) {
    for (const ex of s.exercises) {
      const e = bestOneRepMax(ex);
      if (e !== null && (!strongest || e > strongest.e1rm)) strongest = { name: ex.name, e1rm: e };
    }
  }

  return (
    <>
      <div className="neka-metrics tr-metrics">
        <div className="neka-metric mint">
          <div className="neka-metric-head">Serie</div>
          <strong>{streak.weeks}</strong>
          <span className="neka-unit">{streak.weeks === 1 ? "Woche" : "Wochen"} in Folge</span>
          <div className="tr-week-dots" aria-label={`Trainings der letzten ${weeks.length} Wochen: ${weeks.join(", ")}`}>
            {weeks.map((count, i) => <i key={i} className={count > 0 ? "filled" : ""} style={{ height: 10 + Math.min(count, 4) * 7 }} />)}
          </div>
          <div className="neka-metric-foot"><span>Letzte 8 Wochen</span><span>{streak.thisWeek}× diese Woche</span></div>
        </div>

        <div className="neka-metric plain">
          <div className="neka-metric-head">Diese Woche</div>
          <strong>{thisWeek.length}</strong>
          <span className="neka-unit">{thisWeek.length === 1 ? "Training" : "Trainings"}</span>
          <div className="neka-metric-foot"><span>Volumen</span><span>{weekVolume.value} {weekVolume.unit}</span></div>
        </div>

        <Link href="/training?tab=verlauf" className="neka-metric peach">
          <div className="neka-metric-head">Letztes Training <span>↗</span></div>
          {last && lastInsights && lastVolume ? (
            <>
              <strong className="tr-metric-title">{last.title || "Training"}</strong>
              <span className="neka-unit">{relativeDay(last.session_date, today)} · {lastVolume.value} {lastVolume.unit}</span>
              <div className="neka-metric-foot">
                <span>{lastInsights.prs.length ? `${lastInsights.prs.length} ${lastInsights.prs.length === 1 ? "Bestleistung" : "Bestleistungen"}` : `${lastInsights.sets} Sätze`}</span>
                <span>{lastInsights.volumeDelta !== null ? formatDelta(lastInsights.volumeDelta) : ""}</span>
              </div>
            </>
          ) : (
            <span className="neka-unit">Noch kein Training abgeschlossen.</span>
          )}
        </Link>

        <Link href="/training?tab=fortschritt" className="neka-metric rose">
          <div className="neka-metric-head">Stärkste Übung <span>↗</span></div>
          {strongest ? (
            <>
              <strong>{Math.round(strongest.e1rm)}<small> kg</small></strong>
              <span className="neka-unit">geschätztes 1RM</span>
              <div className="neka-metric-foot"><span>{strongest.name}</span></div>
            </>
          ) : (
            <span className="neka-unit">Noch keine Daten.</span>
          )}
        </Link>
      </div>

      <section className="tr-section">
        <div className="neka-section-title"><h2>Training starten</h2><Link href="/training?tab=vorlagen">Vorlagen ↗</Link></div>
        {templates.length === 0 ? (
          <p className="neka-empty">Noch keine Vorlagen. <Link href="/training?tab=vorlagen">Vorlage anlegen ↗</Link></p>
        ) : (
          <div className="tr-start-grid">
            {templates.map((t) => {
              const lastDone = lastDoneByTitle.get(t.name);
              return (
                <form key={t.id} action={startSession}>
                  <input type="hidden" name="template_id" value={t.id} />
                  <input type="hidden" name="session_date" value={today} />
                  <SubmitButton type="submit" className={`tr-start${t.id === recommendedId ? " recommended" : ""}`}>
                    <span className="tr-start-top">
                      <span className="tr-start-name">{t.name}</span>
                      {t.id === recommendedId && <span className="tr-start-badge">Als Nächstes</span>}
                    </span>
                    <span className="tr-start-meta">
                      {t.exercises.length} Übungen · {lastDone ? `zuletzt ${relativeDay(lastDone, today)}` : "noch nie gemacht"}
                    </span>
                    <span className="tr-start-go" aria-hidden="true">Starten →</span>
                  </SubmitButton>
                </form>
              );
            })}
          </div>
        )}
        <details className="tr-free">
          <summary>Freies Training oder anderes Datum</summary>
          <form action={startSession} className="tr-free-form">
            <div className="form-row" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="template_id">Vorlage</label>
              <select className="input" id="template_id" name="template_id" defaultValue="">
                <option value="">Freies Training (leer)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="session_date">Datum</label>
              <input className="input mono" id="session_date" name="session_date" type="date" defaultValue={today} required />
            </div>
            <button type="submit" className="btn secondary">Starten</button>
          </form>
        </details>
      </section>

      {doneSessions.length > 0 && (
        <section className="tr-section">
          <div className="neka-section-title"><h2>Letzte Trainings</h2><Link href="/training?tab=verlauf">Alle ↗</Link></div>
          <div className="tr-session-list">
            {doneSessions.slice(0, 3).map((s) => <SessionCard key={s.id} session={s} insights={insightsById.get(s.id)!} today={today} />)}
          </div>
        </section>
      )}
    </>
  );
}

/* ===================== Aktive Session ===================== */

function ActiveSessions({
  sessions,
  doneSessions,
  openSessions,
  templates,
}: {
  sessions: WorkoutSessionWithExercises[];
  doneSessions: WorkoutSessionWithExercises[];
  openSessions: WorkoutSessionWithExercises[];
  templates: WorkoutTemplateWithExercises[];
}) {
  const templateNames = templates.flatMap((t) => t.exercises.map((e) => e.name));
  const exerciseNames = collectExerciseNames(sessions, templateNames);
  const lastByName = lastPerformanceByName(doneSessions);
  const lastSets = lastSetsByName(doneSessions);

  return (
    <>
      {openSessions.map((session) => (
        <section key={session.id} className="tr-live" aria-label={`Laufende Session ${session.title || "Training"}`}>
          <div className="tr-live-head">
            <div>
              <span className="tr-live-kicker"><i className="tr-live-dot" aria-hidden="true" />Läuft · {formatDate(session.session_date)}</span>
              <h2>{session.title || "Training"}</h2>
              <p>{session.exercises.length} Übungen · {session.exercises.reduce((n, ex) => n + ex.sets_list.length, 0)} Sätze</p>
            </div>
            <form action={deleteSession}>
              <input type="hidden" name="id" value={session.id} />
              <button type="submit" className="btn ghost sm">Verwerfen</button>
            </form>
          </div>

          {session.exercises.length === 0 ? (
            <EmptyState>Noch keine Übungen — füge unten welche hinzu.</EmptyState>
          ) : (
            session.exercises.map((ex) => (
              <SessionExerciseCard
                key={ex.id}
                exercise={ex}
                prevSummary={lastByName.get(ex.name)}
                prevSets={lastSets.get(ex.name)}
                suggestion={suggestNext(lastSets.get(ex.name))}
              />
            ))
          )}

          <form action={addExercise} className="tr-add-exercise">
            <input type="hidden" name="session_id" value={session.id} />
            <div className="form-row" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor={`add-${session.id}`}>Übung hinzufügen</label>
              <input className="input" id={`add-${session.id}`} name="name" placeholder="Übung wählen/eingeben" list="exercise-names" required />
            </div>
            <button type="submit" className="btn secondary sm">+ Übung</button>
          </form>

          <SessionNote sessionId={session.id} note={session.note} />

          {session.id === openSessions[0].id && <RestTimer />}
          <div className="session-actionbar">
            <form action={completeSession} style={{ flex: 1, display: "flex" }}>
              <input type="hidden" name="id" value={session.id} />
              <SubmitButton type="submit" className="btn primary" style={{ flex: 1, minHeight: 46 }}>
                ✓ Training abschließen
              </SubmitButton>
            </form>
          </div>
        </section>
      ))}

      <datalist id="exercise-names">
        {exerciseNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}

/* ===================== Session-Karte (Übersicht + Verlauf) ===================== */

function SessionCard({ session, insights, today }: { session: WorkoutSessionWithExercises; insights: SessionInsights; today?: string }) {
  const volume = formatVolume(insights.volumeKg);
  return (
    <article className="tr-session">
      <h3 className="tr-session-title">{session.title || "Training"}</h3>
      <div className="tr-session-head">
        <time dateTime={session.session_date}>{today ? relativeDay(session.session_date, today) : formatDate(session.session_date)}</time>
        <div className="tr-session-actions">
          <ShareCardButton data={sessionShareCard(session, insights)} />
          <form action={reopenSession}>
            <input type="hidden" name="id" value={session.id} />
            <button type="submit" className="btn ghost sm">Bearbeiten</button>
          </form>
          <form action={deleteSession}>
            <input type="hidden" name="id" value={session.id} />
            <button type="submit" className="btn ghost sm" aria-label={`${session.title || "Training"} vom ${formatDate(session.session_date)} löschen`}>✕</button>
          </form>
        </div>
      </div>
      {session.note && <p className="tr-session-note">{session.note}</p>}

      {session.exercises.length > 0 && (
        <>
          <dl className="session-insights" aria-label="Kennzahlen der Session">
            {insights.volumeKg > 0 && <div><dt>Volumen</dt><dd>{volume.value} {volume.unit}</dd></div>}
            <div><dt>Sätze</dt><dd>{insights.sets}</dd></div>
            {insights.durationMin !== null && <div><dt>Dauer</dt><dd>{insights.durationMin} min</dd></div>}
            {insights.volumeDelta !== null && (
              <div className={insights.volumeDelta >= 0 ? "up" : "down"}><dt>ggü. letztem Mal</dt><dd>{formatDelta(insights.volumeDelta)}</dd></div>
            )}
            {insights.prs.length > 0 && <div className="pr"><dt>Bestleistungen</dt><dd>{insights.prs.length}</dd></div>}
          </dl>
          <details className="tr-session-exercises">
            <summary>{session.exercises.length} Übungen anzeigen</summary>
            <table className="k-table">
              <tbody>
                {session.exercises.map((ex) => (
                  <tr key={ex.id}>
                    <td>
                      {ex.name}
                      {insights.prs.includes(ex.name) && <span className="pr-tag" title="Neue Bestleistung">PR</span>}
                    </td>
                    <td className="mono">{formatSetsSummary(ex)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </article>
  );
}

/* ===================== TAB: Verlauf ===================== */

function VerlaufTab({
  doneSessions,
  insightsById,
}: {
  doneSessions: WorkoutSessionWithExercises[];
  insightsById: Map<string, SessionInsights>;
}) {
  if (doneSessions.length === 0) {
    return <EmptyState>Noch keine abgeschlossenen Sessions.</EmptyState>;
  }

  // Nach Monaten gruppiert, jüngste zuerst — alles sichtbar statt zugeklappt.
  const months = new Map<string, WorkoutSessionWithExercises[]>();
  for (const s of doneSessions) {
    const key = s.session_date.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), s]);
  }

  return (
    <div className="tr-history">
      {[...months.entries()].map(([month, list]) => (
        <section key={month} className="tr-section">
          <div className="neka-section-title">
            <h2>{new Date(month + "-01T00:00:00").toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</h2>
            <span className="tr-count">{list.length} {list.length === 1 ? "Training" : "Trainings"}</span>
          </div>
          <div className="tr-session-list">
            {list.map((s) => <SessionCard key={s.id} session={s} insights={insightsById.get(s.id)!} />)}
          </div>
        </section>
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

  const oneRepMax = new Map<string, number>();
  for (const s of doneSessions) {
    for (const ex of s.exercises) {
      const e = bestOneRepMax(ex);
      if (e !== null && e > (oneRepMax.get(ex.name) ?? 0)) oneRepMax.set(ex.name, e);
    }
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
                {oneRepMax.has(b.name) && (
                  <small className="one-rep-max" title="Geschätztes Maximalgewicht für 1 Wiederholung (Epley), aus deinem besten Satz bis 12 Wdh.">
                    1RM ≈ {Math.round(oneRepMax.get(b.name)!)} kg
                  </small>
                )}
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
