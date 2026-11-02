"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { macroKeys, starterMealTemplates, resolveMealTemplate, templateMealMacros, validMealDate, validateTemplate } from "@/lib/mealTemplates";
import type { MealTemplate, Macros } from "@/lib/mealTemplates";

async function authenticated() {
  const db = await createClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Nicht angemeldet");
  return { db, userId: data.user.id };
}
function refresh() { for (const path of ["/erik/ernaehrung", "/erik", "/heute"]) revalidatePath(path); }
function entry(date: string, token: string) {
  if (!validMealDate(date) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) throw new Error("Ungültiges Datum oder Eintrag");
}
function rounded(macros: Macros) {
  if (macroKeys.some(k => !Number.isFinite(macros[k]) || macros[k] < 0 || macros[k] > 1000000)) throw new Error("Bitte die Menge prüfen.");
  return Object.fromEntries(macroKeys.map(k => [k, Math.round(macros[k])])) as Macros;
}

export async function saveMealTemplate(input: MealTemplate) {
  const recipe = validateTemplate(input);
  const { db, userId } = await authenticated();
  const { error } = await db.from("meal_templates").upsert({ user_id: userId, template_key: recipe.key, recipe, updated_at: new Date().toISOString() }, { onConflict: "user_id,template_key" });
  if (error) throw new Error("Vorlage konnte nicht gespeichert werden. Prüfe, ob Migration 0014 ausgeführt wurde.");
  refresh();
  return recipe;
}

export async function logMealTemplate(input: { key: string; date: string; entryKey: string; portions: number; grams?: number; ingredientGrams?: number[] }) {
  entry(input.date, input.entryKey);
  const { db, userId } = await authenticated();
  const { data, error: readError } = await db.from("meal_templates").select("recipe").eq("user_id", userId).eq("template_key", input.key).maybeSingle();
  if (readError) throw readError;
  const raw = data?.recipe ?? starterMealTemplates.find(t => t.key === input.key);
  if (!raw) throw new Error("Gericht nicht gefunden");
  const recipe = resolveMealTemplate(validateTemplate(raw));
  const macros = rounded(templateMealMacros(recipe, input.portions, input.grams, input.ingredientGrams));
  const quantity = input.ingredientGrams ? "angepasste Zutatenmengen" : input.grams !== undefined ? `${input.grams} g` : `${input.portions.toLocaleString("de-DE")} Portion${input.portions === 1 ? "" : "en"}`;
  const { error } = await db.from("meals").upsert({ user_id: userId, eaten_on: input.date, entry_key: input.entryKey, name: `${recipe.name} · ${quantity}${recipe.estimated ? " · ca." : ""}`, ...macros }, { onConflict: "user_id,entry_key", ignoreDuplicates: true });
  if (error) throw error;
  refresh();
}

export async function repeatMeal(input: { sourceId: string; date: string; entryKey: string }) {
  entry(input.date, input.entryKey);
  const { db, userId } = await authenticated();
  const { data, error: readError } = await db.from("meals").select("name,kcal,protein_g,carbs_g,fat_g").eq("id", input.sourceId).eq("user_id", userId).single();
  if (readError || !data) throw new Error("Mahlzeit nicht gefunden");
  const { error } = await db.from("meals").upsert({ ...data, user_id: userId, eaten_on: input.date, entry_key: input.entryKey }, { onConflict: "user_id,entry_key", ignoreDuplicates: true });
  if (error) throw error;
  refresh();
}
