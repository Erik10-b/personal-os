import type { WorkoutSessionWithExercises } from "@/lib/services/training";
import { estimateOneRepMax } from "@/lib/trainingCoach";

export const effortLevels = [
  { label: "Sehr leicht", detail: "Fast keine Anstrengung." },
  { label: "Leicht", detail: "Du hättest deutlich länger trainieren können." },
  { label: "Moderat", detail: "Du hast dich bewegt und noch viel Reserve." },
  { label: "Etwas anstrengend", detail: "Spürbare Arbeit, mit reichlich Reserve." },
  { label: "Anstrengend", detail: "Eine solide Belastung mit etwas Reserve." },
  { label: "Deutlich anstrengend", detail: "Du musstest dich konzentrieren und einsetzen." },
  { label: "Hart", detail: "Weitere Arbeit wäre deutlich schwieriger geworden." },
  { label: "Sehr hart", detail: "Nur noch wenig Reserve am Ende der Einheit." },
  { label: "Extrem hart", detail: "Du warst sehr nah an deinem Tageslimit." },
  { label: "Maximal", detail: "Heute wäre keine weitere Belastung mehr möglich gewesen." },
] as const;

export function validSetInput(weight: unknown, reps: unknown) {
  const w = Number(weight), r = Number(reps);
  if (weight == null || reps == null || String(weight).trim() === "" || String(reps).trim() === "" || !Number.isFinite(w) || w < 0 || w > 9999.99 || !Number.isInteger(r) || r < 1 || r > 1000) throw new Error("Bitte ein gültiges Gewicht und 1–1000 Wiederholungen eingeben.");
  return { weight_kg: Math.round(w * 100) / 100, reps: r };
}

export function nextPlannedSet(exercises: WorkoutSessionWithExercises["exercises"]) {
  for (const exercise of exercises) {
    const set = [...exercise.sets_list].sort((a, b) => a.position - b.position).find(s => s.is_done === false);
    if (set) return { exercise, set };
  }
  return null;
}

export function exerciseComparison(current: { weight_kg: number; reps: number }[], previous?: { weight_kg: number; reps: number }[]) {
  if (!previous?.length) return "Erstmals erfasst";
  const score = (sets: typeof current) => Math.max(0, ...sets.map(s => estimateOneRepMax(s.weight_kg, s.reps) ?? s.weight_kg));
  const before = score(previous), after = score(current);
  if (before === 0) return "Erfasst";
  const change = Math.round((after / before - 1) * 100);
  return change === 0 ? "Gleiches Niveau" : `${change > 0 ? "+" : ""}${change}% geschätzte Kraft`;
}
