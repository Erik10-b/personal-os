import { getHabitsWithLogs } from "@/lib/services/habits";
import { createHabit, toggleHabitLog, archiveHabit } from "@/lib/actions/habits";

function getLast28Days(): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = 27; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

export default async function HabitsPage() {
  const habits = await getHabitsWithLogs(28);
  const days = getLast28Days();

  const dailyRates = days.map((day) => {
    if (habits.length === 0) return 0;
    const done = habits.filter((h) => h.logs.some((l) => l.log_date === day)).length;
    return done / habits.length;
  });

  const weeks = [0, 1, 2, 3].map((w) => {
    const wRates = dailyRates.slice(w * 7, (w + 1) * 7);
    const avg = wRates.reduce((s, r) => s + r, 0) / wRates.length;
    return { num: w + 1, rates: wRates, avg };
  });

  const overallRate = dailyRates.reduce((s, r) => s + r, 0) / dailyRates.length;

  const ranking = habits
    .map((h) => {
      const done = days.filter((d) => h.logs.some((l) => l.log_date === d)).length;
      return { id: h.id, name: h.name, rate: done / days.length };
    })
    .sort((a, b) => b.rate - a.rate);

  const dayLabels = days.map((d) =>
    new Date(d + "T00:00:00").getDate().toString().padStart(2, "0")
  );

  // SVG chart
  const W = 560;
  const H = 110;
  const n = dailyRates.length;
  const pts = dailyRates.map((r, i) => ({
    x: (i / (n - 1)) * W,
    y: H - r * H * 0.82 - H * 0.08,
  }));
  const linePts = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `M0,${H} ${pts.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} L${W},${H} Z`;

  // Gauge
  const gaugeR = 54;
  const gaugeCirc = 2 * Math.PI * gaugeR;
  const gaugeOffset = gaugeCirc * (1 - overallRate);

  const weekColors = ["var(--purple)", "var(--warning)", "var(--success)", "var(--club)"];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Habits</h1>
          <p>28-Tage-Übersicht · {habits.length} aktive Gewohnheiten</p>
        </div>
        <form action={createHabit} style={{ display: "flex", gap: "var(--space-2)" }}>
          <input
            className="input"
            name="name"
            placeholder="Neue Habit anlegen"
            required
            style={{ minWidth: 160 }}
          />
          <button type="submit" className="btn primary sm">
            Anlegen
          </button>
        </form>
      </div>

      {habits.length === 0 ? (
        <div className="empty-state">Noch keine Habits angelegt. Leg deine erste Gewohnheit an!</div>
      ) : (
        <div className="habit-dash">
          {/* Row 1: Trend chart + Gauge */}
          <div className="habit-dash-top">
            <div className="card habit-chart-card">
              <span className="habit-section-label">28-TAGE TREND</span>
              <svg
                viewBox={`0 0 ${W} ${H + 20}`}
                style={{ width: "100%", overflow: "visible", display: "block" }}
              >
                <defs>
                  <linearGradient id="hg" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#hg)" />
                <path
                  d={linePts}
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 5px rgba(16,185,129,0.5))" }}
                />
                {[0, 6, 13, 20, 27].map((i) => (
                  <text
                    key={i}
                    x={(i / (n - 1)) * W}
                    y={H + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--text-tertiary)"
                    fontFamily="var(--font-mono)"
                  >
                    {dayLabels[i]}
                  </text>
                ))}
              </svg>
            </div>

            <div className="card habit-gauge-card">
              <span className="habit-section-label">COMPLETION</span>
              <div className="habit-gauge">
                <svg viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                  <circle cx="60" cy="60" r={gaugeR} fill="none" stroke="var(--bg-surface-3)" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r={gaugeR}
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth="10"
                    strokeDasharray={`${gaugeCirc.toFixed(2)}`}
                    strokeDashoffset={`${gaugeOffset.toFixed(2)}`}
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0 0 6px rgba(16,185,129,0.5))" }}
                  />
                </svg>
                <div className="habit-gauge-inner">
                  <div className="habit-gauge-pct">{Math.round(overallRate * 100)}%</div>
                  <div className="habit-gauge-sub">28 Tage</div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: 4-week bar charts */}
          <div className="habit-week-grid">
            {weeks.map((week, wi) => (
              <div key={wi} className="card">
                <div className="habit-week-head">
                  <span className="habit-section-label" style={{ color: weekColors[wi], marginBottom: 0 }}>
                    WOCHE {week.num}
                  </span>
                  <span className="habit-week-pct">{Math.round(week.avg * 100)}%</span>
                </div>
                <div className="habit-week-bars">
                  {week.rates.map((rate, di) => (
                    <div key={di} className="habit-bar-col">
                      <div className="habit-bar-track">
                        <div
                          className="habit-bar-fill"
                          style={{
                            height: `${Math.round(rate * 100)}%`,
                            background: weekColors[wi],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Row 3: Matrix + Rankings */}
          <div className="habit-dash-bottom">
            <div className="card" style={{ minWidth: 0 }}>
              <div className="habit-matrix-hd">
                <span className="habit-section-label" style={{ marginBottom: 0 }}>TÄGLICHE MATRIX</span>
                <div className="habit-legend">
                  <span className="habit-legend-item">
                    <span
                      className="habit-legend-dot"
                      style={{ background: "var(--bg-surface-3)", border: "1px solid var(--border-subtle)" }}
                    />
                    Nicht erledigt
                  </span>
                  <span className="habit-legend-item">
                    <span className="habit-legend-dot" style={{ background: "var(--success)" }} />
                    Erledigt
                  </span>
                </div>
              </div>
              <div className="habit-matrix-scroll">
                <table className="habit-matrix">
                  <thead>
                    <tr>
                      <th className="hm-th-name">HABIT</th>
                      {dayLabels.map((label, i) => (
                        <th key={i} className="hm-th-day">{label}</th>
                      ))}
                      <th className="hm-th-day" />
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map((habit) => {
                      const logDates = new Set(habit.logs.map((l) => l.log_date));
                      return (
                        <tr key={habit.id} className="hm-row">
                          <td className="hm-td-name">
                            <span className="hm-habit-name">{habit.name}</span>
                          </td>
                          {days.map((day) => {
                            const checked = logDates.has(day);
                            return (
                              <td key={day} className="hm-td-cell">
                                <form action={toggleHabitLog} style={{ display: "inline-block", lineHeight: 0 }}>
                                  <input type="hidden" name="habit_id" value={habit.id} />
                                  <input type="hidden" name="log_date" value={day} />
                                  <input type="hidden" name="checked" value={String(checked)} />
                                  <button
                                    type="submit"
                                    className={`habit-cell${checked ? " done" : ""}`}
                                    title={`${habit.name} · ${day}`}
                                    aria-label={`${day}${checked ? " erledigt" : ""}`}
                                  />
                                </form>
                              </td>
                            );
                          })}
                          <td className="hm-td-cell">
                            <form action={archiveHabit} style={{ display: "inline-block", lineHeight: 0 }}>
                              <input type="hidden" name="id" value={habit.id} />
                              <button
                                type="submit"
                                className="habit-archive-btn"
                                title="Archivieren"
                                aria-label="Habit archivieren"
                              >
                                ×
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rankings */}
            <div className="card">
              <span className="habit-section-label">TOP HABITS</span>
              <ul className="habit-ranking">
                {ranking.map((h, i) => (
                  <li key={h.id} className={`habit-rank-item${i >= 5 ? " dimmed" : ""}`}>
                    <span className="habit-rank-num">{(i + 1).toString().padStart(2, "0")}</span>
                    <span className="habit-rank-name">{h.name}</span>
                    <span className="habit-rank-pct">{Math.round(h.rate * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
