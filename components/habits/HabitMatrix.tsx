import { HabitWithLogs } from "@/lib/services/habits";
import { archiveHabit, toggleHabitLog } from "@/lib/actions/habits";
import { getTodayKey } from "@/lib/habitUtils";

export function HabitMatrix({ habits, days }: { habits: HabitWithLogs[]; days: string[] }) {
  const dayLabels = days.map((d) => new Date(d + "T00:00:00").getDate().toString().padStart(2, "0"));
  const todayKey = getTodayKey();

  // Mobile: nur 4 Tage um "heute" (vorgestern..morgen) sichtbar, Rest per CSS ausgeblendet
  const todayIdx = days.indexOf(todayKey);
  const mobileStart = todayIdx === -1 ? Math.max(0, days.length - 4) : Math.max(0, todayIdx - 2);
  const mobileEnd = todayIdx === -1 ? days.length : Math.min(days.length, todayIdx + 2);
  const isMobileVisible = (i: number) => i >= mobileStart && i < mobileEnd;

  return (
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
            <span className="habit-legend-dot" style={{ background: "var(--club)" }} />
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
                <th
                  key={i}
                  className={`hm-th-day${days[i] === todayKey ? " today" : ""}${!isMobileVisible(i) ? " hm-mobile-hide" : ""}`}
                >
                  {label}
                </th>
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
                  {days.map((day, i) => {
                    const checked = logDates.has(day);
                    const isToday = day === todayKey;
                    return (
                      <td
                        key={day}
                        className={`hm-td-cell${isToday ? " today" : ""}${!isMobileVisible(i) ? " hm-mobile-hide" : ""}`}
                      >
                        <form action={toggleHabitLog} style={{ display: "block", width: "100%", lineHeight: 0 }}>
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
                      <button type="submit" className="habit-archive-btn" title="Archivieren" aria-label="Habit archivieren">
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
  );
}
