import { getMatches, summarizeMatches } from "@/lib/services/matches";
import { deleteMatch } from "@/lib/actions/matches";
import { MatchForm } from "@/components/matches/MatchForm";
import { EmptyState } from "@/components/ui/Card";

export default async function FussballStatistikPage() {
  const matches = await getMatches();
  const summary = summarizeMatches(matches);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Fußball · Statistik</h1>
          <p>Spiele, Ergebnisse und eigene Tore im Überblick.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: "var(--space-8)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Spiele</div>
          <div className="kpi-value">{summary.played}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">S / U / N</div>
          <div className="kpi-value">
            {summary.wins} / {summary.draws} / {summary.losses}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tore (Team)</div>
          <div className="kpi-value success">
            {summary.goalsFor}:{summary.goalsAgainst}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Eigene Tore (Erik)</div>
          <div className="kpi-value club">{summary.ownGoals}</div>
        </div>
      </div>

      <MatchForm />

      {matches.length === 0 ? (
        <EmptyState>Noch keine Spiele eingetragen.</EmptyState>
      ) : (
        <table className="k-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Gegner</th>
              <th>Ergebnis</th>
              <th>Eigene Tore</th>
              <th>Notiz</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id}>
                <td className="mono">{new Date(m.played_on).toLocaleDateString("de-DE")}</td>
                <td>
                  <strong>{m.opponent}</strong>
                </td>
                <td className="mono">
                  {m.goals_for}:{m.goals_against}
                </td>
                <td className="mono">{m.own_goals}</td>
                <td>{m.note}</td>
                <td className="right">
                  <form action={deleteMatch}>
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="btn ghost sm">
                      Löschen
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
