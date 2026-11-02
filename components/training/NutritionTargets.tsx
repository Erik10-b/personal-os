import { saveNutritionGoals } from "@/lib/actions/nutritionGoals";
import type { NutritionGoals } from "@/lib/nutritionGoals";
import { SubmitButton } from "@/components/ui/SubmitButton";

const labels: Record<keyof NutritionGoals, string> = { kcal: "Kalorien", protein_g: "Eiweiß", carbs_g: "Kohlenhydrate", fat_g: "Fett" };

export function NutritionTargets({ totals, goals, configured }: { totals: NutritionGoals; goals: NutritionGoals; configured: boolean }) {
  return <section aria-label="Tagesziele" style={{ marginBottom: "var(--space-6)" }}>
    <div className="fitness-targets">{(Object.keys(labels) as (keyof NutritionGoals)[]).map(key => {
      const remaining = goals[key] - totals[key];
      return <div className="card" key={key}><h2>{labels[key]}</h2><strong>{Math.round(totals[key])} / {goals[key]} {key === "kcal" ? "kcal" : "g"}</strong><progress max={goals[key]} value={Math.min(totals[key], goals[key])} /><small>{Math.abs(Math.round(remaining))} {key === "kcal" ? "kcal" : "g"} {remaining >= 0 ? "übrig" : "über Ziel"}</small></div>;
    })}</div>
    <details className="card"><summary>Tagesziele anpassen</summary><p>{configured ? "Deine Ziele werden mit deinem Konto synchronisiert." : "Startwerte – bitte an deine eigenen Ziele anpassen und speichern."}</p><form action={saveNutritionGoals} className="fitness-goals-form">{(Object.keys(labels) as (keyof NutritionGoals)[]).map(key => <label key={key}>{labels[key]} ({key === "kcal" ? "kcal" : "g"})<input className="input" type="number" name={key} defaultValue={goals[key]} min="1" max={key === "kcal" ? 15000 : 2000} step="1" required /></label>)}<SubmitButton type="submit" className="btn primary">Ziele speichern</SubmitButton></form></details>
  </section>;
}
