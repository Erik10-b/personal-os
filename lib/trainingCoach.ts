import { normalizedSets } from "@/lib/trainingUtils";
import type { ExerciseLike, NormalizedSet } from "@/lib/trainingUtils";

/** Wiederholungsbereich für die doppelte Progression: erst Wdh. bis zur Obergrenze, dann mehr Gewicht. */
export const REP_RANGE = { min: 6, max: 10 } as const;

const kg = (value: number) => value.toLocaleString("de-DE", { maximumFractionDigits: 2 });

/** Sätze der letzten abgeschlossenen Ausführung je Übungsname (doneSessions jüngste zuerst). */
export function lastSetsByName(
  doneSessions: { exercises: (ExerciseLike & { name: string })[] }[]
): Map<string, NormalizedSet[]> {
  const map = new Map<string, NormalizedSet[]>();
  for (const session of doneSessions) {
    for (const ex of session.exercises) {
      if (!map.has(ex.name)) map.set(ex.name, normalizedSets(ex));
    }
  }
  return map;
}

export interface Suggestion {
  weight_kg: number;
  reps: number;
  label: string;
  reason: string;
}

/**
 * Vorschlag für heute aus dem letzten Mal: Haben alle Sätze mit dem Top-Gewicht die
 * Obergrenze erreicht, gibt es mehr Gewicht — sonst eine Wiederholung mehr.
 */
export function suggestNext(prev: NormalizedSet[] | undefined): Suggestion | null {
  if (!prev || prev.length === 0) return null;
  const top = Math.max(...prev.map((s) => s.weight_kg));
  const topSets = prev.filter((s) => s.weight_kg === top);
  const minReps = Math.min(...topSets.map((s) => s.reps));

  if (top === 0) {
    const reps = minReps + 1;
    return { weight_kg: 0, reps, label: `${reps} Wdh.`, reason: "Eigengewicht: eine Wiederholung mehr als letztes Mal." };
  }
  if (minReps >= REP_RANGE.max) {
    const step = top >= 20 ? 2.5 : 1;
    const weight = top + step;
    return {
      weight_kg: weight,
      reps: REP_RANGE.min,
      label: `${kg(weight)} kg × ${REP_RANGE.min}`,
      reason: `Alle Sätze mit ${kg(top)} kg hatten ${REP_RANGE.max}+ Wdh. — Zeit für +${kg(step)} kg.`,
    };
  }
  const reps = Math.max(REP_RANGE.min, minReps + 1);
  return {
    weight_kg: top,
    reps,
    label: `${kg(top)} kg × ${reps}`,
    reason: `Gleiches Gewicht, Ziel ${reps} Wdh. in jedem Satz. Ab ${REP_RANGE.max} Wdh. geht's hoch.`,
  };
}

/** Geschätztes Maximalgewicht für eine Wiederholung (Epley). Über 12 Wdh. wird die Formel ungenau. */
export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (weight <= 0 || reps <= 0 || reps > 12) return null;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

export function bestOneRepMax(ex: ExerciseLike): number | null {
  return normalizedSets(ex).reduce<number | null>((best, s) => {
    const e = estimateOneRepMax(s.weight_kg, s.reps);
    return e !== null && (best === null || e > best) ? e : best;
  }, null);
}

function weekStart(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/**
 * Wochen in Folge mit mindestens einem Training. Ruhetage brechen nichts; die laufende
 * Woche zählt erst, wenn trainiert wurde, bricht die Serie aber auch nicht.
 */
export function weekStreak(sessionDates: string[], today: string): { weeks: number; thisWeek: number } {
  const weeks = new Set(sessionDates.map(weekStart));
  const current = weekStart(today);
  const thisWeek = sessionDates.filter((d) => weekStart(d) === current).length;
  // Zeitumstellung verschiebt Mitternacht um eine Stunde — daher über Datumsrechnung statt fester Millisekunden.
  const prevWeek = (t: number) => { const d = new Date(t); d.setDate(d.getDate() - 7); return d.getTime(); };
  let cursor = weeks.has(current) ? current : prevWeek(current);
  let count = 0;
  while (weeks.has(cursor)) {
    count++;
    cursor = prevWeek(cursor);
    if (count > 520) break;
  }
  return { weeks: count, thisWeek };
}

/** Trainings je Woche für die letzten `count` Wochen, älteste zuerst (für die Wochenpunkte). */
export function recentWeeks(sessionDates: string[], today: string, count = 8): number[] {
  const counts = new Map<number, number>();
  for (const d of sessionDates) counts.set(weekStart(d), (counts.get(weekStart(d)) ?? 0) + 1);
  const result: number[] = [];
  const cursor = new Date(weekStart(today));
  for (let i = 0; i < count; i++) {
    result.unshift(counts.get(cursor.getTime()) ?? 0);
    cursor.setDate(cursor.getDate() - 7);
  }
  return result;
}

/** "heute", "gestern", "vor 3 Tagen" — ab einer Woche das Datum. */
export function relativeDay(iso: string, today: string): string {
  const days = Math.round((Date.parse(today + "T12:00:00") - Date.parse(iso + "T12:00:00")) / 86400000);
  if (days <= 0) return "heute";
  if (days === 1) return "gestern";
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}
