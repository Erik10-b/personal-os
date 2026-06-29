import { TodoRow, TodoUrgency } from "@/lib/types";

export const URGENCY_TIERS: { key: TodoUrgency; label: string }[] = [
  { key: "today", label: "Heute" },
  { key: "this_week", label: "Diese Woche" },
  { key: "this_month", label: "Diesen Monat" },
  { key: "someday", label: "Irgendwann" },
];

export function groupByUrgency(todos: TodoRow[]) {
  const open = todos.filter((t) => !t.done);
  return URGENCY_TIERS.map((tier) => ({
    ...tier,
    todos: open.filter((t) => t.urgency === tier.key),
  }));
}
