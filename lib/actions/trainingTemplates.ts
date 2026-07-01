"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTemplate(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const { error } = await supabase.from("workout_templates").insert({
    user_id: userData.user.id,
    name: String(formData.get("name")),
  });

  if (error) throw error;
  revalidatePath("/training");
}

export async function deleteTemplate(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("workout_templates").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/training");
}

export async function addTemplateExercise(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const { error } = await supabase.from("workout_template_exercises").insert({
    template_id: String(formData.get("template_id")),
    user_id: userData.user.id,
    name: String(formData.get("name")),
    default_sets: Math.max(1, Math.round(Number(formData.get("default_sets") ?? 3))),
    default_reps: Math.max(1, Math.round(Number(formData.get("default_reps") ?? 8))),
    default_weight_kg: Math.max(0, Number(formData.get("default_weight_kg") ?? 0)),
  });

  if (error) throw error;
  revalidatePath("/training");
}

export async function deleteTemplateExercise(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("workout_template_exercises").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/training");
}

export async function createSessionFromTemplate(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const templateId = String(formData.get("template_id"));
  const sessionDate = String(formData.get("session_date"));

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .select("name")
    .eq("id", templateId)
    .single();
  if (templateError) throw templateError;

  const { data: templateExercises, error: exercisesError } = await supabase
    .from("workout_template_exercises")
    .select("*")
    .eq("template_id", templateId)
    .order("order_index", { ascending: true });
  if (exercisesError) throw exercisesError;

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userData.user.id,
      session_date: sessionDate,
      title: template.name,
    })
    .select("id")
    .single();
  if (sessionError) throw sessionError;

  if (templateExercises && templateExercises.length > 0) {
    const { error: insertError } = await supabase.from("workout_exercises").insert(
      templateExercises.map((ex) => ({
        session_id: session.id,
        user_id: userData.user!.id,
        name: ex.name,
        sets: ex.default_sets,
        reps: ex.default_reps,
        weight_kg: ex.default_weight_kg,
      }))
    );
    if (insertError) throw insertError;
  }

  revalidatePath("/training");
}
