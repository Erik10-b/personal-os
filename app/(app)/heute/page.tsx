import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/services/dashboard";
import { toggleHabitLog } from "@/lib/actions/habits";
import { toggleTodo } from "@/lib/actions/todos";
import { EmptyState } from "@/components/ui/Card";

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
  const data = await getDashboardData();
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const name = (userData.user?.email ?? "").split("@")[0];

  const now = new Date();
  const dateLabel = now.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const openHabits = data.habits.filter((h) => !h.doneToday).length;
  const summaryParts = [
    `${data.todayEvents.length} Termin${data.todayEvents.length === 1 ? "" : "e"}`,
    `${data.dueTodos.length} Aufgabe${data.dueTodos.length === 1 ? "" : "n"} fällig`,
    `${openHabits} Habit${openHabits === 1 ? "" : "s"} offen`,
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 style={{ textTransform: "capitalize" }}>
            {greeting(now.getHours())}
            {name ? `, ${name}` : ""}
          </h1>
          <p style={{ textTransform: "capitalize" }}>{dateLabel}</p>
          <p style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 12 }}>
            {summaryParts.join("  ·  ")}
          </p>
        </div>
      </div>

      {/* Schnellaktionen */}
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-8)" }}>
        <Link href="/termine" className="btn secondary sm">
          + Termin
        </Link>
        <Link href="/finanzielles/neu" className="btn secondary sm">
          + Buchung
        </Link>
        <Link href="/erik/todos" className="btn secondary sm">
          + Aufgabe
        </Link>
        <Link href="/erik/gewicht" className="btn secondary sm">
          + Gewicht
        </Link>
      </div>

      {/* KPI-Zeile */}
      <div className="kpi-grid" style={{ marginBottom: "var(--space-8)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Saldo (Monat)</div>
          <div className={`kpi-value ${data.month.balance >= 0 ? "club" : "danger"}`}>
            {formatEuro(data.month.balance)}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Gewicht</div>
          <div className="kpi-value">
            {data.latestWeight ? data.latestWeight.weight_kg : "–"}
            {data.latestWeight && <span className="unit">kg</span>}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Habits heute</div>
          <div className="kpi-value success">
            {data.habits.length - openHabits}
            <span className="unit">/ {data.habits.length}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "var(--space-6)",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        {/* Heutige Termine */}
        <div>
          <h3 className="chart-title" style={{ marginBottom: "var(--space-3)" }}>
            Heute
          </h3>
          <div className="card">
            {data.todayEvents.length === 0 ? (
              <EmptyState>Keine Termine heute.</EmptyState>
            ) : (
              <div className="card-list">
                {data.todayEvents.map((event) => (
                  <div
                    key={event.id}
                    style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}
                  >
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
        </div>

        {/* Fällige Aufgaben */}
        <div>
          <h3 className="chart-title" style={{ marginBottom: "var(--space-3)" }}>
            Fällig
          </h3>
          <div className="card">
            {data.dueTodos.length === 0 ? (
              <EmptyState>Nichts fällig. 🎉</EmptyState>
            ) : (
              <div className="card-list">
                {data.dueTodos.map((todo) => {
                  const overdue = todo.due_date! < data.todayStr;
                  return (
                    <div
                      key={todo.id}
                      style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}
                    >
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

        {/* Habits heute */}
        <div>
          <h3 className="chart-title" style={{ marginBottom: "var(--space-3)" }}>
            Habits
          </h3>
          <div className="card">
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
                      <button
                        type="submit"
                        className={`checkbox ${doneToday ? "checked" : ""}`}
                        aria-label="heute erledigt"
                      />
                    </form>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        textDecoration: doneToday ? "line-through" : "none",
                      }}
                    >
                      {habit.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
