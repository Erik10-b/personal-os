import { localDateKey } from "@/lib/dateUtils";
import { getHabitsWithLogs } from "@/lib/services/habits";
import { getWeightLogs } from "@/lib/services/weight";
import { getTodos } from "@/lib/services/todos";
import { getGoals } from "@/lib/services/goals";
import { getMealsForDate, sumMacros } from "@/lib/services/meals";
import { createHabit } from "@/lib/actions/habits";
import { logWeight } from "@/lib/actions/weight";
import { createMeal, deleteMeal } from "@/lib/actions/meals";
import { HabitMatrix } from "@/components/habits/HabitMatrix";
import { getCurrentMonthAllDays } from "@/lib/habitUtils";
import { WeightLineChart } from "@/components/charts/WeightLineChart";
import { KanbanBoard } from "@/components/todos/KanbanBoard";
import { GoalSection } from "@/components/goals/GoalSection";
import { EmptyState } from "@/components/ui/Card";
import Link from "next/link";

function SectionHead({ title, linkHref, linkLabel }: { title: string; linkHref?: string; linkLabel?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        margin: "var(--space-8) 0 var(--space-4)",
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
      {linkHref && (
        <Link href={linkHref} className="btn ghost sm">
          {linkLabel ?? "Details →"}
        </Link>
      )}
    </div>
  );
}

export default async function ErikPage() {
  const today = localDateKey();

  const [habits, weightLogs, todos, weekGoals, monthGoals, todayMeals] = await Promise.all([
    getHabitsWithLogs(31),
    getWeightLogs(60),
    getTodos("erik"),
    getGoals("week"),
    getGoals("month"),
    getMealsForDate(today),
  ]);

  const latestWeight = weightLogs[weightLogs.length - 1];
  const mealTotals = sumMacros(todayMeals);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Erik</h1>
          <p>Habits, Gewicht, To-Do&apos;s, Ziele und Ernährung — alles auf einer Seite.</p>
        </div>
      </div>

      {/* ===== Habits ===== */}
      <SectionHead title="Habits" linkHref="/erik/habits" linkLabel="Analytics-Dashboard →" />
      <form action={createHabit} style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
        <input className="input" name="name" placeholder="Neue Habit, z.B. Lesen" required style={{ flex: 1 }} />
        <button type="submit" className="btn primary">
          Anlegen
        </button>
      </form>
      {habits.length === 0 ? (
        <EmptyState>Noch keine Habits angelegt.</EmptyState>
      ) : (
        <HabitMatrix habits={habits} days={getCurrentMonthAllDays()} />
      )}

      {/* ===== Gewicht ===== */}
      <SectionHead title="Gewicht" />
      <div className="kpi-grid" style={{ marginBottom: "var(--space-5)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Aktuell</div>
          <div className="kpi-value club">
            {latestWeight ? latestWeight.weight_kg : "–"}
            {latestWeight && <span className="unit">kg</span>}
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
      <WeightLineChart logs={weightLogs} />

      {/* ===== To-Do's ===== */}
      <SectionHead title="To-Do's" />
      <KanbanBoard area="erik" todos={todos} />

      {/* ===== Ziele ===== */}
      <SectionHead title="Ziele" />
      <div className="module-grid" style={{ marginBottom: "var(--space-6)" }}>
        <GoalSection scope="week" title="Diese Woche" goals={weekGoals} />
        <GoalSection scope="month" title="Dieser Monat" goals={monthGoals} />
      </div>

      {/* ===== Ernährung ===== */}
      <SectionHead title="Ernährung — Heute" />
      <div className="kpi-grid" style={{ marginBottom: "var(--space-5)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Kalorien</div>
          <div className="kpi-value club">{mealTotals.kcal}<span className="unit">kcal</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Protein</div>
          <div className="kpi-value">{mealTotals.protein_g}<span className="unit">g</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Kohlenhydrate</div>
          <div className="kpi-value">{mealTotals.carbs_g}<span className="unit">g</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Fett</div>
          <div className="kpi-value">{mealTotals.fat_g}<span className="unit">g</span></div>
        </div>
      </div>
      <form
        action={createMeal}
        className="card"
        style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end", marginBottom: "var(--space-6)", flexWrap: "wrap" }}
      >
        <input type="hidden" name="eaten_on" value={today} />
        <div className="form-row" style={{ flex: 2, minWidth: 160 }}>
          <label htmlFor="meal-name">Mahlzeit</label>
          <input className="input" id="meal-name" name="name" placeholder="z.B. Haferflocken mit Banane" required />
        </div>
        <div className="form-row" style={{ maxWidth: 100 }}>
          <label htmlFor="meal-kcal">kcal</label>
          <input className="input mono" id="meal-kcal" name="kcal" type="number" min="0" />
        </div>
        <div className="form-row" style={{ maxWidth: 100 }}>
          <label htmlFor="meal-protein">P (g)</label>
          <input className="input mono" id="meal-protein" name="protein_g" type="number" min="0" />
        </div>
        <div className="form-row" style={{ maxWidth: 100 }}>
          <label htmlFor="meal-carbs">C (g)</label>
          <input className="input mono" id="meal-carbs" name="carbs_g" type="number" min="0" />
        </div>
        <div className="form-row" style={{ maxWidth: 100 }}>
          <label htmlFor="meal-fat">F (g)</label>
          <input className="input mono" id="meal-fat" name="fat_g" type="number" min="0" />
        </div>
        <button type="submit" className="btn primary">
          Hinzufügen
        </button>
      </form>

      {todayMeals.length === 0 ? (
        <EmptyState>Noch keine Mahlzeiten heute.</EmptyState>
      ) : (
        <div className="card">
          <table className="k-table">
            <thead>
              <tr>
                <th>Mahlzeit</th>
                <th>kcal</th>
                <th>P</th>
                <th>C</th>
                <th>F</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {todayMeals.map((meal) => (
                <tr key={meal.id}>
                  <td>{meal.name}</td>
                  <td className="mono">{meal.kcal}</td>
                  <td className="mono">{meal.protein_g}g</td>
                  <td className="mono">{meal.carbs_g}g</td>
                  <td className="mono">{meal.fat_g}g</td>
                  <td>
                    <form action={deleteMeal}>
                      <input type="hidden" name="id" value={meal.id} />
                      <button type="submit" className="btn ghost sm">
                        ✕
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
