"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function num(formData: FormData, key: string) {
  const v = formData.get(key);
  return v ? Math.max(0, Math.round(Number(v))) : 0;
}

export async function createMeal(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const { error } = await supabase.from("meals").insert({
    user_id: userData.user.id,
    eaten_on: String(formData.get("eaten_on")),
    name: String(formData.get("name")),
    kcal: num(formData, "kcal"),
    protein_g: num(formData, "protein_g"),
    carbs_g: num(formData, "carbs_g"),
    fat_g: num(formData, "fat_g"),
  });

  if (error) throw error;
  revalidatePath("/erik/ernaehrung");
}

export async function deleteMeal(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("meals").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/erik/ernaehrung");
}
