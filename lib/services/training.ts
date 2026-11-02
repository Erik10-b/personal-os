import { createClient } from "@/lib/supabase/server";
import { WorkoutExerciseRow, WorkoutSessionRow, WorkoutSetRow } from "@/lib/types";
import { bestSet } from "@/lib/trainingUtils";

export interface WorkoutExerciseWithSets extends WorkoutExerciseRow {
  sets_list: WorkoutSetRow[];
}

export interface WorkoutSessionWithExercises extends WorkoutSessionRow {
  exercises: WorkoutExerciseWithSets[];
}

/**
 * `.in()` landet als Query-String in der URL — bei hunderten UUIDs wird die zu lang
 * (HeadersOverflowError). Daher in Paketen abfragen — klein genug, dass auch Supabases
 * Standard-Limit von 1000 Zeilen pro Antwort nicht greift.
 */
const IN_CHUNK = 50;

async function selectIn<T>(
  ids: string[],
  query: (chunk: string[]) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) chunks.push(ids.slice(i, i + IN_CHUNK));
  const results = await Promise.all(chunks.map((chunk) => query(chunk)));
  for (const r of results) if (r.error) throw r.error;
  return results.flatMap((r) => r.data ?? []);
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

  const exercises = await selectIn<WorkoutExerciseRow>(sessions.map((s) => s.id), (chunk) =>
    supabase.from("workout_exercises").select("*").in("session_id", chunk).order("created_at", { ascending: true })
  );

  const sets = await selectIn<WorkoutSetRow>(exercises.map((e) => e.id), (chunk) =>
    supabase.from("workout_sets").select("*").in("exercise_id", chunk).order("position", { ascending: true })
  );

  // Pakete kommen getrennt sortiert zurück — deshalb hier gruppieren und nachsortieren.
  const setsByExercise = new Map<string, WorkoutSetRow[]>();
  for (const s of sets) setsByExercise.set(s.exercise_id, [...(setsByExercise.get(s.exercise_id) ?? []), s]);
  const exercisesBySession = new Map<string, WorkoutExerciseRow[]>();
  for (const e of exercises) exercisesBySession.set(e.session_id, [...(exercisesBySession.get(e.session_id) ?? []), e]);

  return sessions.map((session) => ({
    ...session,
    exercises: (exercisesBySession.get(session.id) ?? [])
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.created_at.localeCompare(b.created_at))
      .filter(e => !session.completed_at || !(setsByExercise.get(e.id)?.length) || setsByExercise.get(e.id)!.some(s => s.is_done !== false))
      .map((e) => ({
        ...e,
        sets_list: (setsByExercise.get(e.id) ?? []).filter(s => !session.completed_at || s.is_done !== false).sort((a, b) => a.position - b.position),
      })),
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
