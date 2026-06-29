"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GoalScope } from "@/lib/types";

export async function createGoal(formData: FormData) {
  const scope = String(formData.get("scope")) as GoalScope;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const { error } = await supabase.from("goals").insert({
    user_id: userData.user.id,
    scope,
    title: String(formData.get("title")),
  });

  if (error) throw error;
  revalidatePath("/erik/goals");
  revalidatePath("/erik");
  revalidatePath("/heute");
}

export async function toggleGoal(formData: FormData) {
  const id = String(formData.get("id"));
  const done = formData.get("done") === "true";
  const supabase = await createClient();

  const { error } = await supabase.from("goals").update({ done: !done }).eq("id", id);
  if (error) throw error;
  revalidatePath("/erik/goals");
  revalidatePath("/erik");
  revalidatePath("/heute");
}

export async function deleteGoal(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/erik/goals");
  revalidatePath("/erik");
  revalidatePath("/heute");
}
