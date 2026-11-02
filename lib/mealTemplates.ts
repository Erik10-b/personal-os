export type Macros = { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
export const macroKeys = ["kcal", "protein_g", "carbs_g", "fat_g"] as const;
export const macroLabels = { kcal: "kcal", protein_g: "Eiweiß (g)", carbs_g: "Kohlenhydrate (g)", fat_g: "Fett (g)" };
export interface RecipeIngredient { name: string; grams: number | null; per100: Macros | null; hint?: string; unit?: "g" | "ml" }
export interface MealTemplate {
  instructions?: string[];
  estimated?: boolean;
  key: string;
  name: string;
  servings: number;
  batchWeightG: number | null;
  mode: "ingredients" | "totals";
  totalMacros: Macros | null;
  ingredients: RecipeIngredient[];
}

// Adjustable recipe suggestions. Generic nutrient estimates except the linked products.
const food = (name: string, grams: number, values: number[], unit: "g" | "ml" = "g", hint?: string): RecipeIngredient => ({ name, grams, unit, per100: { kcal: values[0], protein_g: values[1], carbs_g: values[2], fat_g: values[3] }, ...(hint ? { hint } : {}) });
const cream = (amount: number) => food("Cremefine", amount, [90, 1, 4.5, 7], "ml", "Vorschlag mit 7 % Fett; bei anderer Sorte Packungswerte anpassen");
const chicken = (amount: number) => food("Hähnchen", amount, [110, 23, 0, 1.5]);
const pasta = (amount: number) => food("Nudeln", amount, [350, 12, 70, 1.5], "g", "Trockenmenge");
const oil = (amount: number) => food("Olivenöl", amount, [884, 0, 0, 100]);
const starter = (key: string, name: string, servings: number, ingredients: RecipeIngredient[], instructions: string[]): MealTemplate => ({ key, name, ingredients, servings, instructions, estimated: true, batchWeightG: null, mode: "ingredients", totalMacros: null });
export const starterMealTemplates: MealTemplate[] = [
  starter("quark-muesli", "Quark mit Butterkeks-Müsli", 1, [food("Magerquark", 500, [67,12,4,0.2]), food("Crunchy Butterkeks Müsli", 60, [440,8,66,15]), food("Flohsamenschalen",5,[190,2,2,0.5])], ["Quark mit etwas Wasser cremig rühren.", "Flohsamenschalen unterrühren und bei Bedarf mehr Wasser zugeben.", "Müsli kurz vor dem Essen darübergeben, damit es knusprig bleibt."]),
  starter("haehnchen-curry", "Hähnchen-Reis-Curry", 3, [chicken(400), food("Reis",300,[350,7,78,1],"g","Trockenmenge"), food("Alpro Kokos ohne Zucker",300,[14,0.1,0,1.2],"ml"), cream(150), food("Rote Currypaste",30,[100,2,15,3]), oil(10)], ["Reis nach Packungsangabe garen.", "Hähnchen würfeln, im Öl anbraten und vollständig durchgaren.", "Currypaste kurz mitrösten, Kokosdrink und Cremefine einrühren.", "Etwa 5–10 Minuten sanft köcheln lassen. Mit dem Reis in die eingestellte Portionszahl aufteilen."]),
  starter("hackfleisch-nudeln", "Hackfleisch-Nudeln", 3, [food("Fettreduziertes Hackfleisch",400,[140,21,0,6]), pasta(300), food("Tomaten-Sahne-Sauce",300,[90,2,7,6]), food("Gemüse",300,[35,2,5,0.5]), oil(5)], ["Nudeln nach Packungsangabe garen.", "Hackfleisch im Öl krümelig anbraten und vollständig durchgaren.", "Klein geschnittenes Gemüse zugeben und weich braten.", "Sauce einrühren, erwärmen und mit den Nudeln in die eingestellte Portionszahl aufteilen."]),
  starter("gemueseauflauf", "Brokkoli-Kohlrabi-Auflauf", 3, [food("Brokkoli",500,[34,3,3,0.4]), food("Kohlrabi",300,[27,2,4,0.2]), food("Kartoffeln",750,[77,2,17,0.1]), food("Eier",220,[143,13,1,10],"g","Vorschlag: 4 Eier, ohne Schale zusammen etwa 220 g"), cream(250)], ["Ofen auf 180 °C Umluft vorheizen. Gemüse und geschälte Kartoffeln klein schneiden.", "Kartoffeln und Kohlrabi etwa 8–10 Minuten vorkochen, Brokkoli für die letzten 3 Minuten dazugeben.", "Abgießen und in eine Auflaufform füllen. Eier mit Cremefine, Salz, Pfeffer und Muskat verquirlen und darübergießen.", "Etwa 30–35 Minuten backen, bis die Eimasse vollständig gestockt und die Kartoffeln weich sind. In die eingestellte Portionszahl aufteilen."]),
  starter("drillinge-ajvar", "Drillinge mit Ajvar-Sahne-Soße", 2, [food("Drillinge",600,[77,2,17,0.1]), food("Ajvar",100,[80,1.5,10,3]), cream(150), food("Paprika",200,[31,1,5,0.3]), chicken(300), oil(10)], ["Drillinge waschen, halbieren und mit der Hälfte des Öls, Salz und Paprikapulver mischen.", "Im Airfryer bei 190 °C etwa 20–25 Minuten garen; zwischendurch schütteln und Gargrad prüfen.", "Hähnchenstreifen im übrigen Öl vollständig durchgaren, klein geschnittene Paprika mitbraten.", "Ajvar und Cremefine einrühren, bei Bedarf mit Wasser verdünnen. Mit den Kartoffeln in die eingestellte Portionszahl aufteilen."]),
  starter("skyr-pesto-haehnchen", "Skyr-Pesto-Nudeln mit Hähnchengeschnetzeltem", 2, [pasta(200), food("Skyr",250,[63,11,4,0.2]), food("Pesto",50,[480,5,8,47]), food("Hähnchengeschnetzeltes",300,[110,23,0,1.5]), oil(5)], ["Nudeln nach Packungsangabe kochen und etwas Nudelwasser aufheben.", "Hähnchengeschnetzeltes im Öl vollständig durchgaren.", "Skyr und Pesto mit etwas Nudelwasser glatt rühren.", "Pfanne vom Herd nehmen und Nudeln mit der Sauce unterheben. Nicht mehr stark kochen, damit der Skyr cremig bleibt. In die eingestellte Portionszahl aufteilen."]),
];

/** Fill only missing fields in previously saved starter drafts; retain personal edits. */
export function resolveMealTemplate(saved: MealTemplate): MealTemplate {
  const base = starterMealTemplates.find(t => t.key === saved.key);
  if (!base) return saved;
  let filled = false;
  const ingredients = saved.ingredients.map(item => {
    // Older untouched Drillinge drafts used a blank generic protein placeholder.
    if (saved.key === "drillinge-ajvar" && item.name === "Proteinquelle" && item.grams === null && item.per100 === null) {
      filled = true;
      return { ...base.ingredients.find(i => i.name === "Hähnchen")! };
    }
    const fallback = base.ingredients.find(i => i.name === item.name);
    if (!fallback) return item;
    if (item.grams === null || item.per100 === null) filled = true;
    return { ...item, grams: item.grams ?? fallback.grams, per100: item.per100 ?? fallback.per100, unit: item.unit ?? fallback.unit };
  });
  return { ...saved, ingredients, instructions: saved.instructions ?? base.instructions, estimated: saved.estimated || filled };
}

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
  if (input.instructions !== undefined && (!Array.isArray(input.instructions) || input.instructions.length > 20 || input.instructions.some(s => typeof s !== "string" || s.length > 1000))) throw new Error("Anleitung zu lang");
  if (input.estimated !== undefined && typeof input.estimated !== "boolean") throw new Error("Ungültige Nährwertangabe");
  const ingredients = input.ingredients.map(item => {
    if (!item || typeof item.name !== "string" || !item.name.trim() || item.name.length > 120 || (item.grams !== null && !finite(item.grams, 100000)) || (item.per100 !== null && !macrosValid(item.per100, true))) throw new Error("Bitte Zutaten, Mengen und Nährwerte prüfen.");
    if (item.hint !== undefined && (typeof item.hint !== "string" || item.hint.length > 300)) throw new Error("Zutatenhinweis zu lang");
    if (item.unit !== undefined && item.unit !== "g" && item.unit !== "ml") throw new Error("Ungültige Einheit");
    return { unit: item.unit, name: item.name.trim(), grams: item.grams, per100: item.per100 === null ? null : Object.fromEntries(macroKeys.map(k => [k, item.per100![k]])) as Macros, ...(item.hint ? { hint: item.hint } : {}) };
  });
  return { instructions: input.instructions, estimated: input.estimated, key: input.key, name: input.name.trim(), servings: input.servings, batchWeightG: input.batchWeightG, mode: input.mode, totalMacros: input.totalMacros === null ? null : Object.fromEntries(macroKeys.map(k => [k, input.totalMacros![k]])) as Macros, ingredients };
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
