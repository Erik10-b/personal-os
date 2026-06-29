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
  habits: { habit: HabitRow; doneToday: boolean }[];
  latestWeight: WeightLogRow | null;
  month: { income: number; expense: number; balance: number };
  todayStr: string;
}

function localDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const now = new Date();
  const todayStr = localDateStr(now);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [eventsRes, todosRes, keyTodosRes, habitsRes, habitLogsRes, weightRes, txRes] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .gte("starts_at", startOfDay.toISOString())
        .lt("starts_at", endOfDay.toISOString())
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
      supabase.from("habit_logs").select("habit_id").eq("log_date", todayStr),
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
  const doneHabitIds = new Set(
    (habitLogsRes.data ?? []).map((l: { habit_id: string }) => l.habit_id)
  );

  return {
    todayEvents: (eventsRes.data ?? []) as EventRow[],
    dueTodos: (todosRes.data ?? []) as TodoRow[],
    keyTodos: (keyTodosRes.data ?? []) as TodoRow[],
    habits: habits.map((habit) => ({
      habit,
      doneToday: doneHabitIds.has(habit.id),
    })),
    latestWeight: ((weightRes.data ?? [])[0] ?? null) as WeightLogRow | null,
    month: summarizeMonth((txRes.data ?? []) as TransactionRow[]),
    todayStr,
  };
}
