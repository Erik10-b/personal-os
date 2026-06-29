import Link from "next/link";
import { getDashboardData } from "@/lib/services/dashboard";
import { getRecentActivity } from "@/lib/services/activity";
import { getNetWorthSnapshots } from "@/lib/services/netWorth";
import { getGoals } from "@/lib/services/goals";
import { getMealsForDate, sumMacros } from "@/lib/services/meals";
import { toggleHabitLog } from "@/lib/actions/habits";
import { toggleTodo } from "@/lib/actions/todos";
import { toggleGoal } from "@/lib/actions/goals";
import { EmptyState } from "@/components/ui/Card";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

function greeting(hour: number): string {
  if (hour < 5) return "Gute Nacht";
  if (hour < 11) return "Guten Morgen";
  if (hour < 17) return "Hallo";
  if (hour < 22) return "Guten Abend";
  return "Gute Nacht";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatEuro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default async function HeutePage() {
  const todayStr0 = new Date().toISOString().slice(0, 10);
  const [data, activity, netWorthSnapshots, weekGoals, todayMeals] = await Promise.all([
    getDashboardData(),
    getRecentActivity(8),
    getNetWorthSnapshots(2),
    getGoals("week"),
    getMealsForDate(todayStr0),
  ]);
  const name = "Erik";

  const now = new Date();
  const dateLabel = now.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const openHabits = data.habits.filter((h) => !h.doneToday).length;
  const latestNetWorth = netWorthSnapshots[netWorthSnapshots.length - 1];
  const prevNetWorth = netWorthSnapshots[netWorthSnapshots.length - 2];
  const netWorthDelta = latestNetWorth && prevNetWorth ? latestNetWorth.amount - prevNetWorth.amount : 0;
  const mealTotals = sumMacros(todayMeals);
  const openWeekGoals = weekGoals.filter((g) => !g.done);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 style={{ textTransform: "capitalize" }}>
            {greeting(now.getHours())}
            {name ? `, ${name}` : ""}
          </h1>
          <p style={{ textTransform: "capitalize" }}>{dateLabel}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Linke Spalte: Operator, Finance Pulse, Key Blockers */}
        <div className="dashboard-col">
          <div className="card">
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }}>
              Operator
            </div>
            <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)" }}>Habits heute</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600 }}>
                  {data.habits.length - openHabits}/{data.habits.length}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)" }}>Gewicht</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600 }}>
                  {data.latestWeight ? `${data.latestWeight.weight_kg} kg` : "–"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <Link href="/termine" className="btn secondary sm">+ Termin</Link>
              <Link href="/finanzielles/neu" className="btn secondary sm">+ Buchung</Link>
              <Link href="/erik/todos" className="btn secondary sm">+ Aufgabe</Link>
              <Link href="/erik/gewicht" className="btn secondary sm">+ Gewicht</Link>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }}>
              Finance Pulse
            </div>
            <div style={{ display: "flex", gap: "var(--space-4)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)" }}>Saldo (Monat)</div>
                <div className={`kpi-value ${data.month.balance >= 0 ? "club" : "danger"}`} style={{ fontSize: 20 }}>
                  {formatEuro(data.month.balance)}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)" }}>Vermögen</div>
                <div className="kpi-value" style={{ fontSize: 20 }}>
                  {latestNetWorth ? formatEuro(latestNetWorth.amount) : "–"}
                  {netWorthDelta !== 0 && (
                    <span
                      style={{ fontSize: 11, marginLeft: 6, color: netWorthDelta > 0 ? "var(--success)" : "var(--danger)" }}
                    >
                      {netWorthDelta > 0 ? "+" : ""}
                      {formatEuro(netWorthDelta)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link href="/finanzielles" className="btn ghost sm" style={{ marginTop: "var(--space-3)" }}>
              Details →
            </Link>
          </div>

          <div className="card">
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }}>
              Key Blockers
            </div>
            {data.keyTodos.length === 0 ? (
              <EmptyState>Keine Schlüsselaufgaben offen.</EmptyState>
            ) : (
              <div className="card-list">
                {data.keyTodos.map((todo) => (
                  <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <form action={toggleTodo}>
                      <input type="hidden" name="id" value={todo.id} />
                      <input type="hidden" name="area" value={todo.area} />
                      <input type="hidden" name="done" value="false" />
                      <button type="submit" className="checkbox" aria-label="erledigt" />
                    </form>
                    <span style={{ flex: 1, fontSize: 13 }}>⭐ {todo.title}</span>
                    {todo.due_date && (
                      <span className={`badge ${todo.due_date < data.todayStr ? "danger" : "neutral"} mono`}>
                        {new Date(todo.due_date).toLocaleDateString("de-DE")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mittlere Spalte: Session, Habit Tracker, Priorities */}
        <div className="dashboard-col">
          <div className="card">
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }}>
              Session — Heute
            </div>
            {data.todayEvents.length === 0 ? (
              <EmptyState>Keine Termine heute.</EmptyState>
            ) : (
              <div className="card-list">
                {data.todayEvents.map((event) => (
                  <div key={event.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--club)", minWidth: 44 }}>
                      {formatTime(event.starts_at)}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{event.title}</span>
                    {event.category && <span className="badge neutral">{event.category}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }}>
              Habit Tracker
            </div>
            {data.habits.length === 0 ? (
              <EmptyState>Keine Habits angelegt.</EmptyState>
            ) : (
              <div className="card-list">
                {data.habits.map(({ habit, doneToday }) => (
                  <div
                    key={habit.id}
                    style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", opacity: doneToday ? 0.6 : 1 }}
                  >
                    <form action={toggleHabitLog}>
                      <input type="hidden" name="habit_id" value={habit.id} />
                      <input type="hidden" name="log_date" value={data.todayStr} />
                      <input type="hidden" name="checked" value={String(doneToday)} />
                      <button type="submit" className={`checkbox ${doneToday ? "checked" : ""}`} aria-label="heute erledigt" />
                    </form>
                    <span style={{ flex: 1, fontSize: 13, textDecoration: doneToday ? "line-through" : "none" }}>
                      {habit.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)" }}>
                Priorities — Diese Woche
              </span>
              <Link href="/erik/goals" className="btn ghost sm">Alle →</Link>
            </div>
            {openWeekGoals.length === 0 ? (
              <EmptyState>Keine offenen Wochenziele.</EmptyState>
            ) : (
              <div className="card-list">
                {openWeekGoals.map((goal) => (
                  <div key={goal.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <form action={toggleGoal}>
                      <input type="hidden" name="id" value={goal.id} />
                      <input type="hidden" name="done" value="false" />
                      <button type="submit" className="checkbox" aria-label="erledigt" />
                    </form>
                    <span style={{ flex: 1, fontSize: 13 }}>{goal.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fällige Aufgaben */}
          <div className="card">
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }}>
              Fällig
            </div>
            {data.dueTodos.length === 0 ? (
              <EmptyState>Nichts fällig. 🎉</EmptyState>
            ) : (
              <div className="card-list">
                {data.dueTodos.map((todo) => {
                  const overdue = todo.due_date! < data.todayStr;
                  return (
                    <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <form action={toggleTodo}>
                        <input type="hidden" name="id" value={todo.id} />
                        <input type="hidden" name="area" value={todo.area} />
                        <input type="hidden" name="done" value="false" />
                        <button type="submit" className="checkbox" aria-label="erledigt" />
                      </form>
                      <span style={{ flex: 1, fontSize: 13 }}>{todo.title}</span>
                      <span className={`badge ${overdue ? "danger" : "neutral"}`}>
                        {overdue ? "überfällig" : "heute"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rechte Spalte: Nutrition, Letzte Aktivität */}
        <div className="dashboard-col">
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)" }}>
                Nutrition
              </span>
              <Link href="/erik/ernaehrung" className="btn ghost sm">+ Mahlzeit</Link>
            </div>
            <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)" }}>kcal</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600 }}>{mealTotals.kcal}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)" }}>P / C / F</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {mealTotals.protein_g} / {mealTotals.carbs_g} / {mealTotals.fat_g}
                </div>
              </div>
            </div>
            {todayMeals.length === 0 ? (
              <EmptyState>Noch keine Mahlzeiten heute.</EmptyState>
            ) : (
              <div className="card-list">
                {todayMeals.map((meal) => (
                  <div key={meal.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ flex: 1, fontSize: 13 }}>{meal.name}</span>
                    <span className="badge neutral mono">{meal.kcal} kcal</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }}>
              Letzte Aktivität
            </div>
            <ActivityFeed items={activity} />
          </div>
        </div>
      </div>
    </>
  );
}
