import { HabitWithLogs } from "@/lib/services/habits";
import { archiveHabit, toggleHabitLog } from "@/lib/actions/habits";

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

function computeStreak(logDates: Set<string>): number {
  let streak = 0;
  const d = new Date();
  while (logDates.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function HabitCard({ habit, compact = false }: { habit: HabitWithLogs; compact?: boolean }) {
  const days = lastNDays(compact ? 14 : 28);
  const logDates = new Set(habit.logs.map((l) => l.log_date));
  const streak = computeStreak(logDates);

  const today = days[days.length - 1];
  const yesterday = days[days.length - 2];
  const todayChecked = logDates.has(today);
  const yesterdayChecked = logDates.has(yesterday);

  return (
    <div className={`card ${compact ? "compact" : ""}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: compact ? "var(--space-2)" : "var(--space-3)" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: compact ? 13 : 14 }}>{habit.name}</div>
          {!compact && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-tertiary)" }}>
              {streak > 0 ? `🔥 ${streak} Tage Streak` : "Kein aktiver Streak"}
            </div>
          )}
        </div>
        {compact ? (
          streak > 0 && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-tertiary)" }}>
              🔥 {streak}
            </span>
          )
        ) : (
          <form action={archiveHabit}>
            <input type="hidden" name="id" value={habit.id} />
            <button type="submit" className="btn ghost sm">
              Archivieren
            </button>
          </form>
        )}
      </div>

      <div style={{ display: "flex", gap: compact ? 6 : "var(--space-2)", marginBottom: compact ? "var(--space-2)" : "var(--space-4)" }}>
        <form action={toggleHabitLog} style={{ flex: 1 }}>
          <input type="hidden" name="habit_id" value={habit.id} />
          <input type="hidden" name="log_date" value={yesterday} />
          <input type="hidden" name="checked" value={String(yesterdayChecked)} />
          <button
            type="submit"
            className={`btn sm block ${yesterdayChecked ? "primary" : "secondary"}`}
            style={compact ? { padding: "4px 8px", minHeight: 26, fontSize: 10 } : undefined}
          >
            {yesterdayChecked ? "✓ " : ""}Gestern
          </button>
        </form>
        <form action={toggleHabitLog} style={{ flex: 1 }}>
          <input type="hidden" name="habit_id" value={habit.id} />
          <input type="hidden" name="log_date" value={today} />
          <input type="hidden" name="checked" value={String(todayChecked)} />
          <button
            type="submit"
            className={`btn sm block ${todayChecked ? "primary" : "secondary"}`}
            style={compact ? { padding: "4px 8px", minHeight: 26, fontSize: 10 } : undefined}
          >
            {todayChecked ? "✓ " : ""}Heute
          </button>
        </form>
      </div>

      <div className="heat-grid" style={compact ? { gridTemplateColumns: `repeat(${days.length}, 1fr)` } : undefined}>
        {days.map((day) => {
          const checked = logDates.has(day);
          return (
            <form key={day} action={toggleHabitLog}>
              <input type="hidden" name="habit_id" value={habit.id} />
              <input type="hidden" name="log_date" value={day} />
              <input type="hidden" name="checked" value={String(checked)} />
              <button
                type="submit"
                className={`heat-cell ${checked ? "h4" : "h0"}`}
                title={day}
                aria-label={`${day}${checked ? " erledigt" : ""}`}
              />
            </form>
          );
        })}
      </div>
    </div>
  );
}
