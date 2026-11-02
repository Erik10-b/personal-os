"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { defaultNutritionGoals } from "@/lib/nutritionGoals";

export async function saveNutritionGoals(form: FormData) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) throw new Error("Nicht angemeldet");
  const goals: Record<string, number> = {};
  for (const key of Object.keys(defaultNutritionGoals)) {
    const n = Number(form.get(key));
    if (!Number.isFinite(n) || n <= 0 || n > (key === "kcal" ? 15000 : 2000)) throw new Error("Bitte gültige Ziele eingeben.");
    goals[key] = n;
  }
  const { error } = await supabase.auth.updateUser({ data: { nutrition_goals: goals } });
  if (error) throw error;
  revalidatePath("/erik/ernaehrung");
}
