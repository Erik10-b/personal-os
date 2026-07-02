import { WorkoutSetRow } from "@/lib/types";

export interface NormalizedSet {
  reps: number;
  weight_kg: number;
}

/** Übung mit optionalen Satz-Zeilen; Legacy-Übungen (Import) haben keine Sätze, nur das Tripel. */
export interface ExerciseLike {
  sets: number;
  reps: number;
  weight_kg: number;
  sets_list?: WorkoutSetRow[];
}

/** Liefert die Sätze einer Übung — aus workout_sets, sonst synthetisiert aus dem Legacy-Tripel. */
export function normalizedSets(ex: ExerciseLike): NormalizedSet[] {
  if (ex.sets_list && ex.sets_list.length > 0) {
    return [...ex.sets_list]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ reps: s.reps, weight_kg: s.weight_kg }));
  }
  const count = Math.max(1, ex.sets || 1);
  return Array.from({ length: count }, () => ({ reps: ex.reps, weight_kg: ex.weight_kg }));
}

/** Bester Satz (höchstes Gewicht) einer Übung. */
export function bestSet(ex: ExerciseLike): NormalizedSet {
  const sets = normalizedSets(ex);
  return sets.reduce((best, s) => (s.weight_kg > best.weight_kg ? s : best), sets[0]);
}

/** Gesamtvolumen (Summe reps × Gewicht über alle Sätze). */
export function exerciseVolume(ex: ExerciseLike): number {
  return normalizedSets(ex).reduce((sum, s) => sum + s.reps * s.weight_kg, 0);
}

export function formatWeight(kg: number): string {
  return kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1);
}

/** Kompakte Satz-Zusammenfassung, z.B. "60×8 · 60×7". */
export function formatSetsSummary(ex: ExerciseLike): string {
  return normalizedSets(ex)
    .map((s) => `${formatWeight(s.weight_kg)}×${s.reps}`)
    .join(" · ");
}

/**
 * Letzte erbrachte Leistung je Übungsname über abgeschlossene Sessions
 * (jüngste zuerst erwartet) — als Referenz "Letztes Mal" in der aktiven Session.
 */
export function lastPerformanceByName(
  doneSessions: { exercises: (ExerciseLike & { name: string })[] }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const session of doneSessions) {
    for (const ex of session.exercises) {
      if (!map.has(ex.name)) map.set(ex.name, formatSetsSummary(ex));
    }
  }
  return map;
}
