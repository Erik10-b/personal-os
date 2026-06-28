import { getWeightLogs } from "@/lib/services/weight";
import { logWeight } from "@/lib/actions/weight";
import { WeightLineChart } from "@/components/charts/WeightLineChart";

export default async function GewichtPage() {
  const logs = await getWeightLogs();
  const today = new Date().toISOString().slice(0, 10);
  const latest = logs[logs.length - 1];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Gewicht</h1>
          <p>Tägliches Gewicht eintragen und den Verlauf beobachten.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: "var(--space-6)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Aktuell</div>
          <div className="kpi-value club">
            {latest ? latest.weight_kg : "–"}
            {latest && <span className="unit">kg</span>}
          </div>
        </div>
      </div>

      <form
        action={logWeight}
        className="card"
        style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", marginBottom: "var(--space-6)", flexWrap: "wrap" }}
      >
        <div className="form-row">
          <label htmlFor="logged_on">Datum</label>
          <input className="input mono" id="logged_on" name="logged_on" type="date" defaultValue={today} required />
        </div>
        <div className="form-row">
          <label htmlFor="weight_kg">Gewicht (kg)</label>
          <input className="input mono" id="weight_kg" name="weight_kg" type="number" step="0.1" min="1" required />
        </div>
        <button type="submit" className="btn primary">
          Eintragen
        </button>
      </form>

      <WeightLineChart logs={logs} />
    </>
  );
}
