import { getHabitsWithLogs } from "@/lib/services/habits";
import { createHabit } from "@/lib/actions/habits";
import { HabitCard } from "@/components/habits/HabitCard";
import { EmptyState } from "@/components/ui/Card";

export default async function HabitsPage() {
  const habits = await getHabitsWithLogs();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Habits</h1>
          <p>Tägliche Gewohnheiten tracken, letzte 28 Tage als Verlauf.</p>
        </div>
      </div>

      <form
        action={createHabit}
        style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}
      >
        <input className="input" name="name" placeholder="Neue Habit, z.B. Lesen" required style={{ flex: 1 }} />
        <button type="submit" className="btn primary">
          Anlegen
        </button>
      </form>

      {habits.length === 0 ? (
        <EmptyState>Noch keine Habits angelegt.</EmptyState>
      ) : (
        <div className="card-list">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </>
  );
}
