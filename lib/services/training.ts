import { createClient } from "@/lib/supabase/server";
import { WorkoutExerciseRow, WorkoutSessionRow, WorkoutSetRow } from "@/lib/types";
import { bestSet } from "@/lib/trainingUtils";

export interface WorkoutExerciseWithSets extends WorkoutExerciseRow {
  sets_list: WorkoutSetRow[];
}

export interface WorkoutSessionWithExercises extends WorkoutSessionRow {
  exercises: WorkoutExerciseWithSets[];
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

  const exerciseIds = (exercises ?? []).map((e) => e.id);
  let sets: WorkoutSetRow[] = [];
  if (exerciseIds.length > 0) {
    const { data: setsData, error: setsError } = await supabase
      .from("workout_sets")
      .select("*")
      .in("exercise_id", exerciseIds)
      .order("position", { ascending: true });
    if (setsError) throw setsError;
    sets = setsData ?? [];
  }

  return sessions.map((session) => ({
    ...session,
    exercises: (exercises ?? [])
      .filter((e) => e.session_id === session.id)
      .map((e) => ({ ...e, sets_list: sets.filter((s) => s.exercise_id === e.id) })),
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
      const top = bestSet(ex);
      if (!top) continue;
      const current = bests.get(ex.name);
      if (!current || top.weight_kg > current.weight_kg) {
        bests.set(ex.name, {
          name: ex.name,
          weight_kg: top.weight_kg,
          reps: top.reps,
          achieved_on: session.session_date,
        });
      }
    }
  }

  return Array.from(bests.values()).sort((a, b) => b.weight_kg - a.weight_kg);
}

/** Alle bisher verwendeten Übungsnamen (für Autocomplete/einheitliche Namen). */
export function collectExerciseNames(
  sessions: WorkoutSessionWithExercises[],
  extra: string[] = []
): string[] {
  const set = new Set<string>(extra);
  for (const s of sessions) for (const e of s.exercises) set.add(e.name);
  return Array.from(set).sort((a, b) => a.localeCompare(b, "de"));
}
