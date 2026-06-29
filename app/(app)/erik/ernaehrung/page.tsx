import Link from "next/link";
import { getMealsForDate, sumMacros } from "@/lib/services/meals";
import { createMeal, deleteMeal } from "@/lib/actions/meals";
import { EmptyState } from "@/components/ui/Card";

function shiftDate(date: string, days: number) {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function ErnaehrungPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const activeDate = date ?? today;

  const meals = await getMealsForDate(activeDate);
  const totals = sumMacros(meals);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ernährung</h1>
          <p>Mahlzeiten und Makros manuell erfassen.</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <Link href={`/erik/ernaehrung?date=${shiftDate(activeDate, -1)}`} className="btn ghost sm">
          ← Vortag
        </Link>
        <span className="badge mono">{new Date(activeDate + "T00:00:00").toLocaleDateString("de-DE")}</span>
        <Link href={`/erik/ernaehrung?date=${shiftDate(activeDate, 1)}`} className="btn ghost sm">
          Folgetag →
        </Link>
        {activeDate !== today && (
          <Link href="/erik/ernaehrung" className="btn ghost sm">
            Heute
          </Link>
        )}
      </div>

      <div className="kpi-grid" style={{ marginBottom: "var(--space-6)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Kalorien</div>
          <div className="kpi-value club">{totals.kcal}<span className="unit">kcal</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Protein</div>
          <div className="kpi-value">{totals.protein_g}<span className="unit">g</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Kohlenhydrate</div>
          <div className="kpi-value">{totals.carbs_g}<span className="unit">g</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Fett</div>
          <div className="kpi-value">{totals.fat_g}<span className="unit">g</span></div>
        </div>
      </div>

      <form
        action={createMeal}
        className="card"
        style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end", marginBottom: "var(--space-6)", flexWrap: "wrap" }}
      >
        <input type="hidden" name="eaten_on" value={activeDate} />
        <div className="form-row" style={{ flex: 2, minWidth: 160 }}>
          <label htmlFor="name">Mahlzeit</label>
          <input className="input" id="name" name="name" placeholder="z.B. Haferflocken mit Banane" required />
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
        <button type="submit" className="btn primary">
          Hinzufügen
        </button>
      </form>

      {meals.length === 0 ? (
        <EmptyState>Noch keine Mahlzeiten an diesem Tag.</EmptyState>
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
