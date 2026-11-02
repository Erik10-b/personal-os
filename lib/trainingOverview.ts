import { addDays, localDateKey } from "@/lib/dateUtils";
import { muscleGroups, primaryMuscle } from "@/lib/exerciseCatalog";
import type { WorkoutSessionWithExercises } from "@/lib/services/training";
import { normalizedSets } from "@/lib/trainingUtils";

/** Only completed sessions, never scheduled or future workouts. */
export function trainingOverview(sessions: WorkoutSessionWithExercises[], today: string) {
  const done = sessions.filter(s => s.completed_at && s.session_date <= today);
  const end = new Date(today + "T12:00:00");
  const start = new Date(end.getFullYear(), 0, 1, 12);
  const counts = new Map<string, number>();
  for (const s of done) counts.set(s.session_date, (counts.get(s.session_date) ?? 0) + 1);
  const days: { date: string; count: number }[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push({ date: localDateKey(d), count: counts.get(localDateKey(d)) ?? 0 });
  const monday = addDays(end, -((end.getDay() + 6) % 7));
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const from = localDateKey(addDays(monday, (i - 7) * 7));
    const to = localDateKey(addDays(monday, (i - 6) * 7));
    return { from, sets: done.filter(s => s.session_date >= from && s.session_date < to).reduce((n, s) => n + s.exercises.reduce((m, ex) => m + normalizedSets(ex).filter(set => set.reps > 0).length, 0), 0) };
  });
  const muscles = new Map<string, number>(muscleGroups.map(g => [g, 0]));
  let unknown = 0;
  const since = localDateKey(addDays(end, -27));
  for (const s of done.filter(s => s.session_date >= since)) for (const ex of s.exercises) {
    const sets = normalizedSets(ex).filter(set => set.reps > 0).length;
    const group = primaryMuscle(ex.name);
    if (group) muscles.set(group, muscles.get(group)! + sets); else unknown += sets;
  }
  return { days, weeks, muscles: [...muscles].map(([name, sets]) => ({ name, sets })), unknown };
}
