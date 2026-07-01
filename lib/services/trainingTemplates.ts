import { createClient } from "@/lib/supabase/server";
import { WorkoutTemplateExerciseRow, WorkoutTemplateRow } from "@/lib/types";

export interface WorkoutTemplateWithExercises extends WorkoutTemplateRow {
  exercises: WorkoutTemplateExerciseRow[];
}

export async function getTemplates(): Promise<WorkoutTemplateWithExercises[]> {
  const supabase = await createClient();

  const { data: templates, error: templatesError } = await supabase
    .from("workout_templates")
    .select("*")
    .order("created_at", { ascending: true });

  if (templatesError) throw templatesError;
  if (!templates || templates.length === 0) return [];

  const { data: exercises, error: exercisesError } = await supabase
    .from("workout_template_exercises")
    .select("*")
    .in("template_id", templates.map((t) => t.id))
    .order("order_index", { ascending: true });

  if (exercisesError) throw exercisesError;

  return templates.map((template) => ({
    ...template,
    exercises: (exercises ?? []).filter((e) => e.template_id === template.id),
  }));
}
