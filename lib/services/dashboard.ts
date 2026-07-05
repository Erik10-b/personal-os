import { createClient } from "@/lib/supabase/server";
import { summarizeMonth } from "./transactions";
import {
  EventRow,
  HabitRow,
  TodoRow,
  TransactionRow,
  WeightLogRow,
} from "@/lib/types";

export interface DashboardData {
  todayEvents: EventRow[];
  dueTodos: TodoRow[];
  keyTodos: TodoRow[];
  habits: { habit: HabitRow; doneToday: boolean; doneByDate: Record<string, boolean> }[];
  habitDays: string[];
  latestWeight: WeightLogRow | null;
  month: { income: number; expense: number; balance: number };
  todayStr: string;
}

import { localDateKey as localDateStr } from "@/lib/dateUtils";

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const now = new Date();
  const todayStr = localDateStr(now);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Habit-Fenster: vorgestern, gestern, heute, morgen
  const habitDays = [-2, -1, 0, 1].map((offset) => {
    const d = new Date(startOfDay);
    d.setDate(d.getDate() + offset);
    return localDateStr(d);
  });

  const [eventsRes, todosRes, keyTodosRes, habitsRes, habitLogsRes, weightRes, txRes] =
    await Promise.all([
      // Alle Termine, die heute berühren — auch mehrtägige, die früher begonnen haben
      supabase
        .from("events")
        .select("*")
        .lt("starts_at", endOfDay.toISOString())
        .or(
          `ends_at.gte.${startOfDay.toISOString()},and(ends_at.is.null,starts_at.gte.${startOfDay.toISOString()})`
        )
        .order("starts_at", { ascending: true }),
      supabase
        .from("todos")
        .select("*")
        .eq("done", false)
        .not("due_date", "is", null)
        .lte("due_date", todayStr)
        .order("due_date", { ascending: true }),
      supabase
        .from("todos")
        .select("*")
        .eq("done", false)
        .eq("key", true)
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("habits")
        .select("*")
        .eq("archived", false)
        .order("created_at", { ascending: true }),
      supabase.from("habit_logs").select("habit_id, log_date").in("log_date", habitDays),
      supabase
        .from("weight_logs")
        .select("*")
        .order("logged_on", { ascending: false })
        .limit(1),
      supabase
        .from("transactions")
        .select("*")
        .gte("occurred_on", localDateStr(startOfMonth)),
    ]);

  const habits = (habitsRes.data ?? []) as HabitRow[];
  const logRows = (habitLogsRes.data ?? []) as { habit_id: string; log_date: string }[];
  // pro Habit die erledigten Tage im Fenster
  const doneMap = new Map<string, Set<string>>();
  for (const row of logRows) {
    const set = doneMap.get(row.habit_id) ?? new Set<string>();
    set.add(row.log_date);
    doneMap.set(row.habit_id, set);
  }

  return {
    todayEvents: (eventsRes.data ?? []) as EventRow[],
    dueTodos: (todosRes.data ?? []) as TodoRow[],
    keyTodos: (keyTodosRes.data ?? []) as TodoRow[],
    habits: habits.map((habit) => {
      const doneDates = doneMap.get(habit.id) ?? new Set<string>();
      const doneByDate: Record<string, boolean> = {};
      for (const day of habitDays) doneByDate[day] = doneDates.has(day);
      return { habit, doneToday: doneDates.has(todayStr), doneByDate };
    }),
    habitDays,
    latestWeight: ((weightRes.data ?? [])[0] ?? null) as WeightLogRow | null,
    month: summarizeMonth((txRes.data ?? []) as TransactionRow[]),
    todayStr,
  };
}
