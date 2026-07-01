import { createClient } from "@/lib/supabase/server";
import { WorkoutExerciseRow, WorkoutSessionRow } from "@/lib/types";

export interface WorkoutSessionWithExercises extends WorkoutSessionRow {
  exercises: WorkoutExerciseRow[];
}

export async function getWorkoutSessions(limit = 60): Promise<WorkoutSessionWithExercises[]> {
  const supabase = await createClient();

  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("*")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) return [];

  const { data: exercises, error: exercisesError } = await supabase
    .from("workout_exercises")
    .select("*")
    .in("session_id", sessions.map((s) => s.id))
    .order("created_at", { ascending: true });

  if (exercisesError) throw exercisesError;

  return sessions.map((session) => ({
    ...session,
    exercises: (exercises ?? []).filter((e) => e.session_id === session.id),
  }));
}

export interface PersonalBest {
  name: string;
  weight_kg: number;
  reps: number;
  achieved_on: string;
}

export function getPersonalBests(sessions: WorkoutSessionWithExercises[]): PersonalBest[] {
  const bests = new Map<string, PersonalBest>();

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const current = bests.get(ex.name);
      if (!current || ex.weight_kg > current.weight_kg) {
        bests.set(ex.name, {
          name: ex.name,
          weight_kg: ex.weight_kg,
          reps: ex.reps,
          achieved_on: session.session_date,
        });
      }
    }
  }

  return Array.from(bests.values()).sort((a, b) => b.weight_kg - a.weight_kg);
}
