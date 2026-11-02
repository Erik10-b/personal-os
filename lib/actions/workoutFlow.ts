"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validSetInput } from "@/lib/workoutFlow";

async function authenticated() {
  const db = await createClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Nicht angemeldet");
  return { db, userId: data.user.id };
}

export async function saveWorkoutSet(input: { id: string; weight_kg: number; reps: number; is_done: boolean }) {
  const values = validSetInput(input.weight_kg, input.reps);
  if (typeof input.is_done !== "boolean") throw new Error("Ungültiger Satzstatus");
  const { db, userId } = await authenticated();
  // Join through the parent session: a user may edit only their open workout.
  const { data: row, error: readError } = await db.from("workout_sets").select("exercise_id").eq("id", input.id).eq("user_id", userId).single();
  if (readError || !row) throw new Error("Satz nicht gefunden");
  const { data: exercise } = await db.from("workout_exercises").select("session_id").eq("id", row.exercise_id).eq("user_id", userId).single();
  const { data: session } = await db.from("workout_sessions").select("completed_at").eq("id", exercise?.session_id ?? "").eq("user_id", userId).single();
  if (!session || session.completed_at) throw new Error("Das Training ist bereits beendet. Öffne es zum Bearbeiten erneut.");
  const { data, error } = await db.from("workout_sets").update({ ...values, is_done: input.is_done }).eq("id", input.id).eq("user_id", userId).select("*").single();
  if (error) throw error;
  revalidatePath("/training");
  return data;
}

export async function saveWorkoutExerciseNote(id: string, note: string) {
  if (note.length > 2000) throw new Error("Notiz zu lang");
  const { db, userId } = await authenticated();
  const { error } = await db.from("workout_exercises").update({ note: note.trim() || null }).eq("id", id).eq("user_id", userId);
  if (error) throw error;
  revalidatePath("/training");
}

export async function reorderWorkoutExercises(sessionId: string, ids: string[]) {
  if (ids.length > 200 || new Set(ids).size !== ids.length) throw new Error("Ungültige Reihenfolge");
  const { db, userId } = await authenticated();
  const { data, error } = await db.from("workout_exercises").select("id").eq("session_id", sessionId).eq("user_id", userId);
  if (error) throw error;
  if (data.length !== ids.length || data.some(row => !ids.includes(row.id))) throw new Error("Die Übungsliste hat sich geändert. Bitte neu laden.");
  const { error: writeError } = await db.rpc("reorder_workout_exercises", { target_session: sessionId, ordered_ids: ids });
  if (writeError) throw writeError;
  revalidatePath("/training");
}

export async function finishWorkout(sessionId: string, effort: number | null) {
  if (effort !== null && (!Number.isInteger(effort) || effort < 1 || effort > 10)) throw new Error("Ungültige Anstrengungsbewertung");
  const { db, userId } = await authenticated();
  const { data: exercises, error: exError } = await db.from("workout_exercises").select("id").eq("session_id", sessionId).eq("user_id", userId);
  if (exError) throw exError;
  if (!exercises?.length) throw new Error("Erfasse zuerst mindestens einen Satz.");
  let performed = false;
  for (let i = 0; i < exercises.length; i += 50) {
    const { data, error } = await db.from("workout_sets").select("id").in("exercise_id", exercises.slice(i, i + 50).map(e => e.id)).eq("user_id", userId).eq("is_done", true).limit(1);
    if (error) throw error;
    if (data?.length) performed = true;
  }
  if (!performed) throw new Error("Bestätige zuerst mindestens einen absolvierten Satz.");
  const { data: saved, error } = await db.from("workout_sessions").update({ completed_at: new Date().toISOString(), effort_score: effort }).eq("id", sessionId).eq("user_id", userId).is("completed_at", null).select("id").single();
  if (error || !saved) throw new Error("Training konnte nicht abgeschlossen werden. Bitte neu laden und erneut versuchen.");
  revalidatePath("/training");
  revalidatePath("/heute");
}
