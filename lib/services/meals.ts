import { createClient } from "@/lib/supabase/server";
import { MealRow } from "@/lib/types";

export async function getMealsForDate(date: string): Promise<MealRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("eaten_on", date)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function sumMacros(meals: MealRow[]) {
  return meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein_g: acc.protein_g + m.protein_g,
      carbs_g: acc.carbs_g + m.carbs_g,
      fat_g: acc.fat_g + m.fat_g,
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

export async function getMealDays(days = 30): Promise<{ date: string; meals: MealRow[] }[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .gte("eaten_on", since.toISOString().slice(0, 10))
    .order("eaten_on", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;

  const byDate = new Map<string, MealRow[]>();
  for (const meal of data ?? []) {
    const list = byDate.get(meal.eaten_on) ?? [];
    list.push(meal);
    byDate.set(meal.eaten_on, list);
  }

  return Array.from(byDate.entries()).map(([date, meals]) => ({ date, meals }));
}
