import { TodoPriority, TodoRow, TodoUrgency } from "@/lib/types";

export const URGENCY_TIERS: { key: TodoUrgency; label: string }[] = [
  { key: "today", label: "Heute" },
  { key: "this_week", label: "Diese Woche" },
  { key: "this_month", label: "Diesen Monat" },
  { key: "someday", label: "Irgendwann" },
];

export const PRIORITY_META: Record<TodoPriority, { label: string; badge: string; rank: number }> = {
  high: { label: "Hoch", badge: "danger", rank: 0 },
  medium: { label: "Mittel", badge: "warning", rank: 1 },
  low: { label: "Niedrig", badge: "neutral", rank: 2 },
};

export const PRIORITY_LEVELS: TodoPriority[] = ["high", "medium", "low"];

export function groupByUrgency(todos: TodoRow[]) {
  const open = todos.filter((t) => !t.done);
  return URGENCY_TIERS.map((tier) => ({
    ...tier,
    todos: open
      .filter((t) => t.urgency === tier.key)
      .sort((a, b) => PRIORITY_META[a.priority ?? "medium"].rank - PRIORITY_META[b.priority ?? "medium"].rank),
  }));
}
