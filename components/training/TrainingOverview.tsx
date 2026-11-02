import type { WorkoutSessionWithExercises } from "@/lib/services/training";
import { trainingOverview } from "@/lib/trainingOverview";

export function TrainingOverview({ sessions, today }: { sessions: WorkoutSessionWithExercises[]; today: string }) {
  const data = trainingOverview(sessions, today);
  const total = data.muscles.reduce((n, g) => n + g.sets, 0);
  const max = Math.max(1, ...data.weeks.map(w => w.sets));
  return <section className="fitness-overview" aria-label="Trainingsauswertung">
    <div className="card fitness-year">
      <h2>Dein Jahr {today.slice(0, 4)}</h2>
      <p>Trainingstage bis heute · dunkler bedeutet mehr Einheiten</p>
      <div className="fitness-heatmap">{data.days.map(d => <span key={d.date} title={`${d.date}: ${d.count} Einheiten`} aria-label={`${d.date}: ${d.count} Einheiten`} data-level={Math.min(d.count, 3)} />)}</div>
    </div>
    <div className="card">
      <h2>Muskelverteilung</h2><p>Letzte 28 Tage · Sätze nach primärer Muskelgruppe</p>
      {data.muscles.map(g => <div className="fitness-muscle" key={g.name}><span>{g.name}</span><meter min={0} max={Math.max(total, 1)} value={g.sets} /><span>{g.sets} · {total ? Math.round(g.sets / total * 100) : 0}%</span></div>)}
      <small>{data.unknown} Sätze ohne Zuordnung. Eigene Übungsnamen werden nicht automatisch geschätzt. Sekundäre Muskeln sind nicht eingerechnet.</small>
    </div>
    <div className="card">
      <h2>Sätze je Woche</h2><p>Letzte acht Kalenderwochen · aktuelle Woche bisher</p>
      <div className="fitness-bars">{data.weeks.map(w => <div key={w.from}><strong>{w.sets}</strong><span style={{ height: `${Math.max(2, w.sets / max * 100)}px` }} /><small>{new Date(w.from + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</small></div>)}</div>
      <small>Sätze mit mindestens einer Wiederholung, einschließlich importierter Sätze.</small>
    </div>
  </section>;
}
