export const defaultNutritionGoals = { kcal: 2200, protein_g: 180, carbs_g: 235, fat_g: 60 };
export type NutritionGoals = typeof defaultNutritionGoals;

export function readNutritionGoals(value: unknown): NutritionGoals {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(defaultNutritionGoals).map(([key, fallback]) => {
    const n = Number(raw[key]);
    return [key, Number.isFinite(n) && n > 0 && n <= (key === "kcal" ? 15000 : 2000) ? n : fallback];
  })) as NutritionGoals;
}
