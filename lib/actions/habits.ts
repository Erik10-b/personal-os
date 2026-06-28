"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createHabit(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const { error } = await supabase.from("habits").insert({
    user_id: userData.user.id,
    name: String(formData.get("name")),
  });

  if (error) throw error;
  revalidatePath("/erik/habits");
  revalidatePath("/erik");
}

export async function toggleHabitLog(formData: FormData) {
  const habitId = String(formData.get("habit_id"));
  const logDate = String(formData.get("log_date"));
  const checked = formData.get("checked") === "true";

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  if (checked) {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("log_date", logDate);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: userData.user.id,
      log_date: logDate,
    });
    if (error) throw error;
  }

  revalidatePath("/erik/habits");
  revalidatePath("/erik");
  revalidatePath("/heute");
}

export async function archiveHabit(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("habits").update({ archived: true }).eq("id", id);
  if (error) throw error;
  revalidatePath("/erik/habits");
  revalidatePath("/erik");
}
