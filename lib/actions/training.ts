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

/**
 * Startet eine neue (offene) Session. Wenn eine Vorlage gewählt wurde, werden deren
 * Übungen als Startwerte kopiert. Ohne Vorlage entsteht eine leere Session.
 */
export async function startSession(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");
  const userId = userData.user.id;

  const templateId = formData.get("template_id") ? String(formData.get("template_id")) : "";
  const sessionDate = String(formData.get("session_date"));

  let title: string | null = null;
  let seedExercises: { name: string; sets: number; reps: number; weight_kg: number }[] = [];

  if (templateId) {
    const { data: template, error: templateError } = await supabase
      .from("workout_templates")
      .select("name")
      .eq("id", templateId)
      .maybeSingle();
    if (templateError) throw templateError;
    title = template?.name ?? "Training";

    const { data: templateExercises, error: exercisesError } = await supabase
      .from("workout_template_exercises")
      .select("*")
      .eq("template_id", templateId)
      .order("order_index", { ascending: true });
    if (exercisesError) throw exercisesError;

    seedExercises = (templateExercises ?? []).map((ex) => ({
      name: ex.name,
      sets: ex.default_sets,
      reps: ex.default_reps,
      weight_kg: ex.default_weight_kg,
    }));
  } else {
    title = formData.get("title") ? String(formData.get("title")) : "Freies Training";
  }

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({ user_id: userId, session_date: sessionDate, title, completed_at: null })
    .select("id")
    .single();
  if (sessionError) throw sessionError;
  if (!session) throw new Error("Session konnte nicht angelegt werden");

  if (seedExercises.length > 0) {
    const { error: insertError } = await supabase.from("workout_exercises").insert(
      seedExercises.map((ex) => ({ session_id: session.id, user_id: userId, ...ex }))
    );
    if (insertError) throw insertError;
  }

  revalidatePath("/training");
}

export async function completeSession(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase
    .from("workout_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/training");
}

export async function reopenSession(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("workout_sessions").update({ completed_at: null }).eq("id", id);
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
