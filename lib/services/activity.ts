import { createClient } from "@/lib/supabase/server";

export type ActivityBullet = "success" | "warning" | "danger" | "info" | "club" | "purple";
export type ActivityAmountTone = "up" | "down" | "neutral";

export interface ActivityEntry {
  id: string;
  at: string;
  bullet: ActivityBullet;
  title: string;
  meta: string;
  amount?: string;
  amountTone?: ActivityAmountTone;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "gerade jetzt";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "gestern";
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function formatEuro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export async function getRecentActivity(limit = 8): Promise<ActivityEntry[]> {
  const supabase = await createClient();

  const [txRes, todosRes, habitLogsRes, weightRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, type, amount, category, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("todos")
      .select("id, title, area, done, created_at, updated_at")
      .eq("done", true)
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("habit_logs")
      .select("id, log_date, created_at, habits(name)")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("weight_logs")
      .select("id, weight_kg, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const entries: ActivityEntry[] = [];

  for (const t of txRes.data ?? []) {
    entries.push({
      id: `tx-${t.id}`,
      at: t.created_at,
      bullet: t.type === "income" ? "success" : "danger",
      title: t.type === "income" ? `Einnahme · ${t.category}` : `Ausgabe · ${t.category}`,
      meta: relativeTime(t.created_at),
      amount: `${t.type === "income" ? "+" : "−"}${formatEuro(t.amount)}`,
      amountTone: t.type === "income" ? "up" : "down",
    });
  }

  for (const todo of todosRes.data ?? []) {
    entries.push({
      id: `todo-${todo.id}`,
      at: todo.updated_at,
      bullet: "info",
      title: `Aufgabe erledigt · ${todo.title}`,
      meta: relativeTime(todo.updated_at),
      amount: todo.area === "arbeit" ? "Arbeit" : "Erik",
      amountTone: "neutral",
    });
  }

  for (const log of habitLogsRes.data ?? []) {
    const habitName = (log.habits as unknown as { name: string } | null)?.name ?? "Habit";
    entries.push({
      id: `habit-${log.id}`,
      at: log.created_at,
      bullet: "club",
      title: `Habit erledigt · ${habitName}`,
      meta: relativeTime(log.created_at),
      amountTone: "neutral",
    });
  }

  for (const w of weightRes.data ?? []) {
    entries.push({
      id: `weight-${w.id}`,
      at: w.created_at,
      bullet: "purple",
      title: "Gewicht eingetragen",
      meta: relativeTime(w.created_at),
      amount: `${w.weight_kg} kg`,
      amountTone: "neutral",
    });
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit);
}
