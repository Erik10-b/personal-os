import Link from "next/link";
import { getHabitsWithLogs, HabitWithLogs } from "@/lib/services/habits";
import { createHabit } from "@/lib/actions/habits";
import { HabitMatrix } from "@/components/habits/HabitMatrix";
import { getLastNDays } from "@/lib/habitUtils";

type View = "yearly" | "monthly" | "daily";

function completionRate(habits: HabitWithLogs[], day: string): number {
  if (habits.length === 0) return 0;
  const done = habits.filter((h) => h.logs.some((l) => l.log_date === day)).length;
  return done / habits.length;
}

export default async function HabitsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: rawView } = await searchParams;
  const view: View = rawView === "yearly" || rawView === "daily" ? rawView : "monthly";

  const habits = await getHabitsWithLogs(370);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Habits</h1>
          <p>{habits.length} aktive Gewohnheiten</p>
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

      <div className="pill-tabs" style={{ marginBottom: "var(--space-6)" }}>
        <Link href="/erik/habits?view=yearly" className={`pill-tab ${view === "yearly" ? "active club" : ""}`}>
          Jahr
        </Link>
        <Link href="/erik/habits?view=monthly" className={`pill-tab ${view === "monthly" ? "active club" : ""}`}>
          Monat
        </Link>
        <Link href="/erik/habits?view=daily" className={`pill-tab ${view === "daily" ? "active club" : ""}`}>
          Tageslogs
        </Link>
      </div>

      {habits.length === 0 ? (
        <div className="empty-state">Noch keine Habits angelegt. Leg deine erste Gewohnheit an!</div>
      ) : view === "yearly" ? (
        <YearlyView habits={habits} />
      ) : view === "daily" ? (
        <DailyLogsView habits={habits} />
      ) : (
        <MonthlyView habits={habits} />
      )}
    </>
  );
}

function MonthlyView({ habits }: { habits: HabitWithLogs[] }) {
  const days = getLastNDays(28);
  const dailyRates = days.map((day) => completionRate(habits, day));

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

  // Wochenvergleich: aktuelle 7 Tage vs. vorherige 7 Tage, pro Habit (Top 3)
  const last7 = days.slice(21, 28);
  const prev7 = days.slice(14, 21);
  const weekDelta = habits
    .map((h) => {
      const nowRate = last7.filter((d) => h.logs.some((l) => l.log_date === d)).length / last7.length;
      const prevRate = prev7.filter((d) => h.logs.some((l) => l.log_date === d)).length / prev7.length;
      return { id: h.id, name: h.name, nowRate, delta: nowRate - prevRate };
    })
    .sort((a, b) => b.nowRate - a.nowRate)
    .slice(0, 3);

  const dayLabels = days.map((d) => new Date(d + "T00:00:00").getDate().toString().padStart(2, "0"));

  const W = 560;
  const H = 110;
  const n = dailyRates.length;
  const pts = dailyRates.map((r, i) => ({
    x: (i / (n - 1)) * W,
    y: H - r * H * 0.82 - H * 0.08,
  }));
  const linePts = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `M0,${H} ${pts.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} L${W},${H} Z`;

  const gaugeR = 54;
  const gaugeCirc = 2 * Math.PI * gaugeR;
  const gaugeOffset = gaugeCirc * (1 - overallRate);

  const weekColors = ["var(--purple)", "var(--warning)", "var(--success)", "var(--club)"];

  return (
    <div className="habit-dash">
      {/* Row 1: Trend chart + Gauge */}
      <div className="habit-dash-top">
        <div className="card habit-chart-card">
          <span className="habit-section-label">28-TAGE TREND</span>
          <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: "100%", overflow: "visible", display: "block" }}>
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
                      style={{ height: `${Math.round(rate * 100)}%`, background: weekColors[wi] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Matrix + Rankings + Wochenvergleich */}
      <div className="habit-dash-bottom">
        <HabitMatrix habits={habits} days={days} />

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
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

          {weekDelta.length > 0 && (
            <div className="card">
              <span className="habit-section-label">WOCHENVERGLEICH</span>
              {weekDelta.map((h) => {
                const pct = Math.round(h.delta * 100);
                const tone = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
                const barColor = tone === "up" ? "var(--success)" : tone === "down" ? "var(--danger)" : "var(--text-tertiary)";
                return (
                  <div key={h.id} className="habit-delta-item">
                    <div className="habit-delta-head">
                      <span className="habit-delta-name">{h.name}</span>
                      <span className={`habit-delta-value ${tone}`}>
                        {pct > 0 ? "+" : ""}
                        {pct}%
                      </span>
                    </div>
                    <div className="habit-delta-track">
                      <div
                        className="habit-delta-fill"
                        style={{ width: `${Math.round(h.nowRate * 100)}%`, background: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function YearlyView({ habits }: { habits: HabitWithLogs[] }) {
  const now = new Date();
  const months = Array.from({ length: 12 }).map((_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const isCurrent = year === now.getFullYear() && month === now.getMonth();
    const lastDay = isCurrent ? now.getDate() : daysInMonth;

    let sum = 0;
    for (let d = 1; d <= lastDay; d++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      sum += completionRate(habits, key);
    }
    const avg = lastDay > 0 ? sum / lastDay : 0;

    return {
      label: monthDate.toLocaleDateString("de-DE", { month: "short" }),
      avg,
      isCurrent,
    };
  });

  const yearAvg = months.reduce((s, m) => s + m.avg, 0) / months.length;
  const bestMonth = [...months].sort((a, b) => b.avg - a.avg)[0];

  return (
    <div className="habit-dash">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Ø 12 Monate</div>
          <div className="kpi-value club">{Math.round(yearAvg * 100)}<span className="unit">%</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Bester Monat</div>
          <div className="kpi-value success">{bestMonth ? Math.round(bestMonth.avg * 100) : 0}<span className="unit">% · {bestMonth?.label}</span></div>
        </div>
      </div>

      <div className="card">
        <span className="habit-section-label">MONATSVERGLEICH</span>
        <div className="habit-year-grid">
          {months.map((m, i) => (
            <div key={i} className="habit-year-col">
              <div className="habit-year-track">
                <div
                  className={`habit-year-fill ${m.isCurrent ? "current" : ""}`}
                  style={{ height: `${Math.max(2, Math.round(m.avg * 100))}%` }}
                  title={`${m.label}: ${Math.round(m.avg * 100)}%`}
                />
              </div>
              <span className="habit-year-label">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DailyLogsView({ habits }: { habits: HabitWithLogs[] }) {
  const days = getLastNDays(30).reverse();

  return (
    <div className="card">
      <span className="habit-section-label">LETZTE 30 TAGE</span>
      <div>
        {days.map((day) => {
          const doneHabits = habits.filter((h) => h.logs.some((l) => l.log_date === day));
          const label = new Date(day + "T00:00:00").toLocaleDateString("de-DE", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          });
          return (
            <div key={day} className="habit-daylog">
              <span className="habit-daylog-date">{label}</span>
              <div className="habit-daylog-badges">
                {doneHabits.length === 0 ? (
                  <span className="badge neutral">keine</span>
                ) : (
                  doneHabits.map((h) => (
                    <span key={h.id} className="badge success">{h.name}</span>
                  ))
                )}
              </div>
              <span className="habit-daylog-count">
                {doneHabits.length}/{habits.length}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
