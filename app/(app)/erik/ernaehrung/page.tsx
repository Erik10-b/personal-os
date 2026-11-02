import { MealLibrary } from "@/components/nutrition/MealLibrary";
import { getMealTemplates } from "@/lib/services/mealTemplates";
import { validMealDate } from "@/lib/mealTemplates";
import { NutritionTargets } from "@/components/training/NutritionTargets";
import { readNutritionGoals } from "@/lib/nutritionGoals";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/ui/SubmitButton";
import Link from "next/link";
import { getMealsForDate, sumMacros } from "@/lib/services/meals";
import { createMeal, deleteMeal } from "@/lib/actions/meals";
import { EmptyState } from "@/components/ui/Card";

import { localDateKey } from "@/lib/dateUtils";

function shiftDate(date: string, days: number) {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

export default async function ErnaehrungPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = localDateKey();
  const activeDate = date && validMealDate(date) ? date : today;

  const [meals, previousMeals, library] = await Promise.all([
    getMealsForDate(activeDate),
    getMealsForDate(shiftDate(activeDate, -1)),
    getMealTemplates(),
  ]);
  const totals = sumMacros(meals);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const configured = !!user?.user_metadata?.nutrition_goals;
  const goals = readNutritionGoals(user?.user_metadata?.nutrition_goals);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ernährung</h1>
          <p>Deine Gerichte. Deine Mengen. Mit wenigen Tipps eingetragen.</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <Link href={`/erik/ernaehrung?date=${shiftDate(activeDate, -1)}`} className="btn ghost sm">
          <span className="desktop-arrow" aria-hidden="true">←</span> Vortag
        </Link>
        <span className="badge mono">{new Date(activeDate + "T00:00:00").toLocaleDateString("de-DE")}</span>
        <Link href={`/erik/ernaehrung?date=${shiftDate(activeDate, 1)}`} className="btn ghost sm">
          Folgetag <span className="desktop-arrow" aria-hidden="true">→</span>
        </Link>
        {activeDate !== today && (
          <Link href="/erik/ernaehrung" className="btn ghost sm">
            Heute
          </Link>
        )}
      </div>

      <NutritionTargets totals={totals} goals={goals} configured={configured} />

      <Link href="/erik/health" className="health-shortcut-link"><span><strong>Apple Health verbinden</strong><small>Schritte, Aktivitätsenergie und Gewicht per iPhone-Kurzbefehl</small></span><span aria-hidden="true">↗</span></Link>

      <MealLibrary templates={library.templates} date={activeDate} previousMeals={previousMeals} storageReady={library.storageReady} />

      <details className="meal-manual"><summary>Einmalige Mahlzeit manuell eintragen</summary>
      <form
        action={createMeal}
        className="card"
        style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end", marginBottom: "var(--space-6)", flexWrap: "wrap" }}
      >
        <input type="hidden" name="eaten_on" value={activeDate} />
        <div className="form-row" style={{ flex: 2, minWidth: 160 }}>
          <label htmlFor="name">Mahlzeit</label>
          <input className="input" id="name" name="name" placeholder="z.B. Skyr mit Obst" required />
        </div>
        <div className="form-row" style={{ maxWidth: 100 }}>
          <label htmlFor="kcal">kcal</label>
          <input className="input mono" id="kcal" name="kcal" type="number" min="0" />
        </div>
        <div className="form-row" style={{ maxWidth: 100 }}>
          <label htmlFor="protein_g">P (g)</label>
          <input className="input mono" id="protein_g" name="protein_g" type="number" min="0" />
        </div>
        <div className="form-row" style={{ maxWidth: 100 }}>
          <label htmlFor="carbs_g">C (g)</label>
          <input className="input mono" id="carbs_g" name="carbs_g" type="number" min="0" />
        </div>
        <div className="form-row" style={{ maxWidth: 100 }}>
          <label htmlFor="fat_g">F (g)</label>
          <input className="input mono" id="fat_g" name="fat_g" type="number" min="0" />
        </div>
        <SubmitButton type="submit" className="btn primary">
          Hinzufügen
        </SubmitButton>
      </form>
      </details>

      <h2 style={{ margin: "24px 0 12px" }}>Eingetragen an diesem Tag</h2>
      {meals.length === 0 ? (
        <EmptyState>Noch keine Mahlzeiten an diesem Tag.</EmptyState>
      ) : (
        <div className="card meal-day-log">
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
              {meals.map((meal) => (
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
