import { createClient } from "@/lib/supabase/server";
import { starterMealTemplates, validateTemplate } from "@/lib/mealTemplates";
import type { MealTemplate } from "@/lib/mealTemplates";

export async function getMealTemplates() {
  const db = await createClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) throw new Error("Nicht angemeldet");
  const { data, error } = await db.from("meal_templates").select("template_key, recipe").eq("user_id", auth.user.id).order("updated_at", { ascending: false }).limit(50);
  if (error && (error.code === "42P01" || error.code === "PGRST205")) return { templates: starterMealTemplates, storageReady: false };
  if (error) throw error;
  const saved = new Map<string, MealTemplate>();
  for (const row of data ?? []) saved.set(row.template_key, validateTemplate({ ...row.recipe, key: row.template_key }));
  return {
    templates: [...starterMealTemplates.map(t => saved.get(t.key) ?? t), ...[...saved.values()].filter(t => !starterMealTemplates.some(s => s.key === t.key))],
    storageReady: true,
  };
}
