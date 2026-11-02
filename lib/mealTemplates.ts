export type Macros = { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
export const macroKeys = ["kcal", "protein_g", "carbs_g", "fat_g"] as const;
export const macroLabels = { kcal: "kcal", protein_g: "Eiweiß (g)", carbs_g: "Kohlenhydrate (g)", fat_g: "Fett (g)" };
export interface RecipeIngredient { name: string; grams: number | null; per100: Macros | null; hint?: string }
export interface MealTemplate {
  key: string;
  name: string;
  servings: number;
  batchWeightG: number | null;
  mode: "ingredients" | "totals";
  totalMacros: Macros | null;
  ingredients: RecipeIngredient[];
}

const ingredient = (name: string, grams: number | null = null, hint?: string): RecipeIngredient => ({ name, grams, per100: null, ...(hint ? { hint } : {}) });
const starter = (key: string, name: string, ingredients: RecipeIngredient[], servings = 1): MealTemplate => ({ key, name, ingredients, servings, batchWeightG: null, mode: "ingredients", totalMacros: null });

/** Only known quantities are prefilled; no guessed calorie or product values. */
export const starterMealTemplates: MealTemplate[] = [
  starter("quark-muesli", "Quark mit Butterkeks-Müsli", [ingredient("Magerquark", 500), ingredient("Crunchy Butterkeks Müsli"), ingredient("Flohsamenschalen")]),
  starter("haehnchen-curry", "Hähnchen-Reis-Curry", [ingredient("Hähnchen", 400, "Bisherige Zubereitung: 400 g für 3 Portionen"), ingredient("Reis", null, "Trockenmenge"), ingredient("Alpro Kokos ohne Zucker"), ingredient("Cremefine"), ingredient("Rote Currypaste")], 3),
  starter("hackfleisch-nudeln", "Hackfleisch-Nudeln", [ingredient("Fettreduziertes Hackfleisch", 400), ingredient("Nudeln", null, "Trockenmenge"), ingredient("Tomaten-Sahne-Sauce"), ingredient("Gemüse")]),
  starter("gemueseauflauf", "Brokkoli-Kohlrabi-Auflauf", [ingredient("Brokkoli", null, "Bisher: 1 ganzer Brokkoli; essbaren Anteil wiegen"), ingredient("Kohlrabi", null, "Bisher: 1 ganzer Kohlrabi"), ingredient("Kartoffeln"), ingredient("Eier", null, "Bisher: 4 Eier; Gewicht ohne Schale"), ingredient("Cremefine", null, "Bisher: 1 ganze Packung")]),
  starter("drillinge-ajvar", "Drillinge mit Ajvar-Sahne-Soße", [ingredient("Drillinge"), ingredient("Ajvar"), ingredient("Cremefine"), ingredient("Proteinquelle", null, "Nach Bedarf benennen und ergänzen")]),
  starter("skyr-pesto-haehnchen", "Skyr-Pesto-Nudeln mit Hähnchengeschnetzeltem", [ingredient("Nudeln", null, "Trockenmenge"), ingredient("Skyr"), ingredient("Pesto"), ingredient("Hähnchengeschnetzeltes")]),
];

const emptyMacros = (): Macros => ({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
function finite(value: unknown, max: number, positive = false): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= (positive ? Number.MIN_VALUE : 0) && value <= max;
}
function macrosValid(value: unknown, per100 = false): value is Macros {
  if (!value || typeof value !== "object") return false;
  const raw = value as Macros;
  return macroKeys.every(key => finite(raw[key], per100 ? (key === "kcal" ? 1000 : 100) : (key === "kcal" ? 100000 : 20000)));
}
export function validateTemplate(input: MealTemplate): MealTemplate {
  if (!input || typeof input !== "object" || typeof input.key !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(input.key)) throw new Error("Ungültige Vorlage");
  if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 120) throw new Error("Bitte einen Gerichtnamen angeben (maximal 120 Zeichen).");
  if (!finite(input.servings, 100, true)) throw new Error("Bitte 0–100 Portionen angeben (größer als 0).");
  if (input.batchWeightG !== null && !finite(input.batchWeightG, 100000, true)) throw new Error("Bitte ein gültiges Gesamtgewicht angeben.");
  if (input.mode !== "ingredients" && input.mode !== "totals") throw new Error("Ungültige Berechnungsart");
  if (input.totalMacros !== null && !macrosValid(input.totalMacros)) throw new Error("Bitte gültige Gesamtnährwerte angeben.");
  if (!Array.isArray(input.ingredients) || input.ingredients.length > 30) throw new Error("Maximal 30 Zutaten pro Gericht.");
  const ingredients = input.ingredients.map(item => {
    if (!item || typeof item.name !== "string" || !item.name.trim() || item.name.length > 120 || (item.grams !== null && !finite(item.grams, 100000)) || (item.per100 !== null && !macrosValid(item.per100, true))) throw new Error("Bitte Zutaten, Mengen und Nährwerte prüfen.");
    if (item.hint !== undefined && (typeof item.hint !== "string" || item.hint.length > 300)) throw new Error("Zutatenhinweis zu lang");
    return { name: item.name.trim(), grams: item.grams, per100: item.per100 === null ? null : Object.fromEntries(macroKeys.map(k => [k, item.per100![k]])) as Macros, ...(item.hint ? { hint: item.hint } : {}) };
  });
  return { key: input.key, name: input.name.trim(), servings: input.servings, batchWeightG: input.batchWeightG, mode: input.mode, totalMacros: input.totalMacros === null ? null : Object.fromEntries(macroKeys.map(k => [k, input.totalMacros![k]])) as Macros, ingredients };
}

export function recipeBatchMacros(recipe: MealTemplate): Macros | null {
  if (recipe.mode === "totals") return recipe.totalMacros;
  if (!recipe.ingredients.length || recipe.ingredients.some(i => i.grams === null || (i.grams > 0 && i.per100 === null))) return null;
  return recipe.ingredients.reduce((sum, i) => {
    for (const key of macroKeys) sum[key] += (i.per100?.[key] ?? 0) * (i.grams ?? 0) / 100;
    return sum;
  }, emptyMacros());
}

export function templateMealMacros(recipe: MealTemplate, portions: number, grams?: number, ingredientGrams?: number[]): Macros {
  validateTemplate(recipe);
  const batch = recipeBatchMacros(recipe);
  if (!batch) throw new Error("Bitte zuerst Mengen und Nährwerte der Vorlage ergänzen.");
  if (!finite(portions, 100, true)) throw new Error("Bitte eine gültige Portionsmenge eingeben.");
  if (grams !== undefined && ingredientGrams !== undefined) throw new Error("Bitte entweder Gramm oder einzelne Zutatenmengen wählen.");
  if (ingredientGrams !== undefined) {
    if (recipe.mode !== "ingredients" || ingredientGrams.length !== recipe.ingredients.length || ingredientGrams.some(g => !finite(g, 100000))) throw new Error("Ungültige Zutatenmengen");
    return ingredientGrams.reduce((sum, g, index) => {
      const item = recipe.ingredients[index];
      if (g > 0 && !item.per100) throw new Error(`Nährwerte für ${item.name} fehlen.`);
      for (const key of macroKeys) sum[key] += (item.per100?.[key] ?? 0) * g / 100;
      return sum;
    }, emptyMacros());
  }
  if (grams !== undefined && (!finite(grams, 100000, true) || !recipe.batchWeightG)) throw new Error("Für Grammangaben zuerst das gewogene Gesamtgewicht des fertigen Gerichts speichern.");
  const factor = grams !== undefined ? grams / recipe.batchWeightG! : portions / recipe.servings;
  return Object.fromEntries(macroKeys.map(key => [key, batch[key] * factor])) as Macros;
}

export function validMealDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date + "T12:00:00Z")) && new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date;
}
