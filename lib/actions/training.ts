"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_SET_COUNT = 2;

export async function deleteSession(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("workout_sessions").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/training");
}

/**
 * Startet eine neue (offene) Session. Wenn eine Vorlage gewählt wurde, werden deren
 * Übungen mit je 2 Startsätzen angelegt. Ohne Vorlage entsteht eine leere Session.
 */
export async function startSession(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");
  const userId = userData.user.id;

  const templateId = formData.get("template_id") ? String(formData.get("template_id")) : "";
  const sessionDate = String(formData.get("session_date"));

  let title: string | null = null;
  let seed: { name: string; reps: number; weight_kg: number }[] = [];

  if (templateId) {
    const { data: template } = await supabase
      .from("workout_templates")
      .select("name")
      .eq("id", templateId)
      .maybeSingle();
    title = template?.name ?? "Training";

    const { data: templateExercises, error: exErr } = await supabase
      .from("workout_template_exercises")
      .select("*")
      .eq("template_id", templateId)
      .order("order_index", { ascending: true });
    if (exErr) throw exErr;

    seed = (templateExercises ?? []).map((ex) => ({
      name: ex.name,
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

  for (const s of seed) {
    const { data: exercise, error: exInsErr } = await supabase
      .from("workout_exercises")
      .insert({ session_id: session.id, user_id: userId, name: s.name, sets: DEFAULT_SET_COUNT, reps: s.reps, weight_kg: s.weight_kg })
      .select("id")
      .single();
    if (exInsErr) throw exInsErr;
    if (!exercise) continue;

    const setsToInsert = Array.from({ length: DEFAULT_SET_COUNT }, (_, i) => ({
      exercise_id: exercise.id,
      user_id: userId,
      position: i + 1,
      reps: s.reps,
      weight_kg: s.weight_kg,
    }));
    const { error: setErr } = await supabase.from("workout_sets").insert(setsToInsert);
    if (setErr) throw setErr;
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

export async function updateSessionNote(formData: FormData) {
  const id = String(formData.get("id"));
  const note = formData.get("note") ? String(formData.get("note")) : null;
  const supabase = await createClient();
  const { error } = await supabase.from("workout_sessions").update({ note }).eq("id", id);
  if (error) throw error;
  revalidatePath("/training");
}

/** Fügt der Session eine Übung mit 2 Startsätzen hinzu. */
export async function addExercise(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");
  const userId = userData.user.id;

  const { data: exercise, error } = await supabase
    .from("workout_exercises")
    .insert({
      session_id: String(formData.get("session_id")),
      user_id: userId,
      name: String(formData.get("name")),
      sets: DEFAULT_SET_COUNT,
      reps: 8,
      weight_kg: 0,
    })
    .select("id")
    .single();
  if (error) throw error;
  if (exercise) {
    const setsToInsert = Array.from({ length: DEFAULT_SET_COUNT }, (_, i) => ({
      exercise_id: exercise.id,
      user_id: userId,
      position: i + 1,
      reps: 8,
      weight_kg: 0,
    }));
    const { error: setErr } = await supabase.from("workout_sets").insert(setsToInsert);
    if (setErr) throw setErr;
  }
  revalidatePath("/training");
}

export async function deleteExercise(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("workout_exercises").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/training");
}

/** Fügt einer Übung einen weiteren Satz hinzu (übernimmt die Werte des letzten Satzes). */
export async function addSet(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");
  const userId = userData.user.id;

  const exerciseId = String(formData.get("exercise_id"));

  const { data: existing, error: readErr } = await supabase
    .from("workout_sets")
    .select("position, reps, weight_kg")
    .eq("exercise_id", exerciseId)
    .order("position", { ascending: false })
    .limit(1);
  if (readErr) throw readErr;

  const last = existing?.[0];
  const nextPosition = (last?.position ?? 0) + 1;

  const { error } = await supabase.from("workout_sets").insert({
    exercise_id: exerciseId,
    user_id: userId,
    position: nextPosition,
    reps: last?.reps ?? 8,
    weight_kg: last?.weight_kg ?? 0,
  });
  if (error) throw error;
  revalidatePath("/training");
}

export async function updateSet(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_sets")
    .update({
      reps: Math.max(0, Math.round(Number(formData.get("reps") ?? 0))),
      weight_kg: Math.max(0, Number(formData.get("weight_kg") ?? 0)),
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/training");
}

export async function deleteSet(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("workout_sets").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/training");
}
