import type { WorkoutSessionWithExercises } from "@/lib/services/training";
import { bestSet, exerciseVolume, normalizedSets } from "@/lib/trainingUtils";

export interface SessionInsights {
  volumeKg: number;
  sets: number;
  reps: number;
  /** Dauer in Minuten — nur wenn plausibel (Import-Sessions haben keine echte Dauer). */
  durationMin: number | null;
  /** Volumen-Veränderung zur letzten Session mit gleichem Titel, als Anteil (0.08 = +8 %). */
  volumeDelta: number | null;
  /** Übungen, deren bester Satz schwerer ist als alles davor. */
  prs: string[];
  top: { name: string; best: string }[];
}

/** Kennzahlen einer abgeschlossenen Session; `older` sind alle früheren Sessions (jüngste zuerst). */
export function sessionInsights(
  session: WorkoutSessionWithExercises,
  older: WorkoutSessionWithExercises[]
): SessionInsights {
  const volumeKg = session.exercises.reduce((sum, ex) => sum + exerciseVolume(ex), 0);
  const allSets = session.exercises.flatMap((ex) => normalizedSets(ex));

  const priorBest = new Map<string, number>();
  for (const s of older) {
    for (const ex of s.exercises) {
      const w = bestSet(ex).weight_kg;
      priorBest.set(ex.name, Math.max(priorBest.get(ex.name) ?? 0, w));
    }
  }
  const prs = session.exercises
    .filter((ex) => {
      const before = priorBest.get(ex.name);
      const now = bestSet(ex).weight_kg;
      return before !== undefined && now > 0 && now > before;
    })
    .map((ex) => ex.name);

  const previous = older.find((s) => (s.title ?? "") === (session.title ?? ""));
  const previousVolume = previous?.exercises.reduce((sum, ex) => sum + exerciseVolume(ex), 0) ?? 0;
  const volumeDelta = previous && previousVolume > 0 && volumeKg > 0 ? volumeKg / previousVolume - 1 : null;

  let durationMin: number | null = null;
  if (session.completed_at) {
    const minutes = (Date.parse(session.completed_at) - Date.parse(session.created_at)) / 60000;
    if (minutes >= 0 && minutes <= 240) durationMin = Math.round(minutes);
  }

  const top = [...session.exercises]
    .sort((a, b) => exerciseVolume(b) - exerciseVolume(a))
    .slice(0, 4)
    .map((ex) => {
      const best = bestSet(ex);
      return { name: ex.name, best: best.weight_kg > 0 ? `${number(best.weight_kg, best.weight_kg % 1 ? 1 : 0)} kg × ${best.reps}` : `${best.reps} Wdh.` };
    });

  return {
    volumeKg,
    sets: allSets.length,
    reps: allSets.reduce((sum, s) => sum + s.reps, 0),
    durationMin,
    volumeDelta,
    prs,
    top,
  };
}

const number = (value: number, digits = 0) =>
  value.toLocaleString("de-DE", { maximumFractionDigits: digits, minimumFractionDigits: digits });

/** "12,4 t" ab einer Tonne, sonst "860 kg". */
export function formatVolume(kg: number): { value: string; unit: string } {
  return kg >= 1000 ? { value: number(kg / 1000, 1), unit: "t" } : { value: number(kg), unit: "kg" };
}

export function formatDelta(delta: number): string {
  const pct = Math.round(delta * 100);
  return `${pct > 0 ? "+" : pct < 0 ? "−" : "±"}${Math.abs(pct)} %`;
}
