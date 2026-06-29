import Link from "next/link";
import { getHabitsWithLogs } from "@/lib/services/habits";
import { getWeightLogs } from "@/lib/services/weight";
import { getTodos } from "@/lib/services/todos";
import { getGoals } from "@/lib/services/goals";

export default async function ErikPage() {
  const [habits, weightLogs, todos, weekGoals] = await Promise.all([
    getHabitsWithLogs(),
    getWeightLogs(7),
    getTodos("erik"),
    getGoals("week"),
  ]);

  const openTodos = todos.filter((t) => !t.done).length;
  const latestWeight = weightLogs[weightLogs.length - 1];
  const activeHabits = habits.length;
  const openGoals = weekGoals.filter((g) => !g.done).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Erik</h1>
          <p>Habits, Gewicht und To-Do&apos;s im Überblick.</p>
        </div>
      </div>

      <div className="module-grid">
        <Link href="/erik/habits" className="module-card" style={{ "--module-color": "var(--mod-erik)" } as React.CSSProperties}>
          <div className="module-name">Habits</div>
          <div className="module-desc">{activeHabits} aktive Habit{activeHabits === 1 ? "" : "s"}</div>
        </Link>

        <Link href="/erik/gewicht" className="module-card" style={{ "--module-color": "var(--mod-erik)" } as React.CSSProperties}>
          <div className="module-name">Gewicht</div>
          <div className="module-desc">
            {latestWeight ? `${latestWeight.weight_kg} kg zuletzt` : "Noch kein Eintrag"}
          </div>
        </Link>

        <Link href="/erik/todos" className="module-card" style={{ "--module-color": "var(--mod-erik)" } as React.CSSProperties}>
          <div className="module-name">To-Do&apos;s</div>
          <div className="module-desc">{openTodos} offen</div>
        </Link>

        <Link href="/erik/goals" className="module-card" style={{ "--module-color": "var(--mod-erik)" } as React.CSSProperties}>
          <div className="module-name">Ziele</div>
          <div className="module-desc">{openGoals} offen diese Woche</div>
        </Link>

        <Link href="/erik/ernaehrung" className="module-card" style={{ "--module-color": "var(--mod-erik)" } as React.CSSProperties}>
          <div className="module-name">Ernährung</div>
          <div className="module-desc">Mahlzeiten & Makros</div>
        </Link>
      </div>
    </>
  );
}
