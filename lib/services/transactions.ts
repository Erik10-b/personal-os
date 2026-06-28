import { createClient } from "@/lib/supabase/server";
import { TransactionRow } from "@/lib/types";

export async function getTransactions(limit = 200): Promise<TransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("occurred_on", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export function summarizeMonth(transactions: TransactionRow[], reference = new Date()) {
  const month = reference.getMonth();
  const year = reference.getFullYear();

  const monthTx = transactions.filter((t) => {
    const d = new Date(t.occurred_on);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const income = monthTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, balance: income - expense };
}

export function expensesByCategory(transactions: TransactionRow[], reference = new Date()) {
  const month = reference.getMonth();
  const year = reference.getFullYear();

  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const d = new Date(t.occurred_on);
    if (d.getMonth() !== month || d.getFullYear() !== year) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }

  return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
}

export function monthlyTrend(transactions: TransactionRow[], months = 6) {
  const buckets = new Map<string, { income: number; expense: number }>();
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { income: 0, expense: 0 });
  }

  for (const t of transactions) {
    const d = new Date(t.occurred_on);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (t.type === "income") bucket.income += t.amount;
    else bucket.expense += t.amount;
  }

  return Array.from(buckets.entries()).map(([key, val]) => {
    const [year, month] = key.split("-");
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("de-DE", {
      month: "short",
    });
    return { label, ...val };
  });
}
