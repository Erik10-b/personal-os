"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createMatch(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const { error } = await supabase.from("matches").insert({
    user_id: userData.user.id,
    played_on: String(formData.get("played_on")),
    opponent: String(formData.get("opponent")),
    goals_for: Number(formData.get("goals_for") ?? 0),
    goals_against: Number(formData.get("goals_against") ?? 0),
    own_goals: Number(formData.get("own_goals") ?? 0),
    note: formData.get("note") ? String(formData.get("note")) : null,
  });

  if (error) throw error;
  revalidatePath("/fussball/statistik");
}

export async function deleteMatch(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/fussball/statistik");
}
