"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSession(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const { error } = await supabase.from("workout_sessions").insert({
    user_id: userData.user.id,
    session_date: String(formData.get("session_date")),
    title: formData.get("title") ? String(formData.get("title")) : null,
    note: formData.get("note") ? String(formData.get("note")) : null,
  });

  if (error) throw error;
  revalidatePath("/training");
}

export async function deleteSession(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("workout_sessions").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/training");
}

export async function addExercise(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const { error } = await supabase.from("workout_exercises").insert({
    session_id: String(formData.get("session_id")),
    user_id: userData.user.id,
    name: String(formData.get("name")),
    sets: Math.max(1, Math.round(Number(formData.get("sets") ?? 1))),
    reps: Math.max(1, Math.round(Number(formData.get("reps") ?? 1))),
    weight_kg: Math.max(0, Number(formData.get("weight_kg") ?? 0)),
  });

  if (error) throw error;
  revalidatePath("/training");
}

export async function updateExercise(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase
    .from("workout_exercises")
    .update({
      sets: Math.max(1, Math.round(Number(formData.get("sets") ?? 1))),
      reps: Math.max(1, Math.round(Number(formData.get("reps") ?? 1))),
      weight_kg: Math.max(0, Number(formData.get("weight_kg") ?? 0)),
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/training");
}

export async function deleteExercise(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("workout_exercises").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/training");
}
