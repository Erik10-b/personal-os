import { createClient } from "@/lib/supabase/server";
import { HabitLogRow, HabitRow } from "@/lib/types";

export interface HabitWithLogs extends HabitRow {
  logs: HabitLogRow[];
}

export async function getHabitsWithLogs(days = 28): Promise<HabitWithLogs[]> {
  const supabase = await createClient();

  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: true });

  if (habitsError) throw habitsError;
  if (!habits || habits.length === 0) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: logs, error: logsError } = await supabase
    .from("habit_logs")
    .select("*")
    .gte("log_date", since.toISOString().slice(0, 10));

  if (logsError) throw logsError;

  return habits.map((habit) => ({
    ...habit,
    logs: (logs ?? []).filter((l) => l.habit_id === habit.id),
  }));
}
