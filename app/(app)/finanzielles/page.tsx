import Link from "next/link";
import {
  expensesByCategory,
  getTransactions,
  monthlyTrend,
  summarizeMonth,
} from "@/lib/services/transactions";
import { deleteTransaction } from "@/lib/actions/transactions";
import { ExpenseByCategoryChart, MonthlyTrendChart } from "@/components/charts/ExpenseCharts";
import { EmptyState } from "@/components/ui/Card";

function formatEuro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default async function FinanziellesPage() {
  const transactions = await getTransactions();
  const summary = summarizeMonth(transactions);
  const categories = expensesByCategory(transactions);
  const trend = monthlyTrend(transactions);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Finanzielles</h1>
          <p>Einnahmen, Ausgaben und Auswertungen.</p>
        </div>
        <Link href="/finanzielles/neu" className="btn primary">
          + Neue Buchung
        </Link>
      </div>

      <div className="kpi-grid" style={{ marginBottom: "var(--space-8)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Einnahmen (Monat)</div>
          <div className="kpi-value success">{formatEuro(summary.income)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Ausgaben (Monat)</div>
          <div className="kpi-value danger">{formatEuro(summary.expense)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Saldo</div>
          <div className={`kpi-value ${summary.balance >= 0 ? "club" : "danger"}`}>
            {formatEuro(summary.balance)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "var(--space-6)",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          marginBottom: "var(--space-8)",
        }}
      >
        <ExpenseByCategoryChart data={categories} />
        <MonthlyTrendChart data={trend} />
      </div>

      {transactions.length === 0 ? (
        <EmptyState>Noch keine Buchungen.</EmptyState>
      ) : (
        <table className="k-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Kategorie</th>
              <th>Notiz</th>
              <th className="right">Betrag</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td className="mono">{new Date(t.occurred_on).toLocaleDateString("de-DE")}</td>
                <td>{t.category}</td>
                <td>{t.note}</td>
                <td className={`right mono ${t.type === "income" ? "" : ""}`}>
                  <strong style={{ color: t.type === "income" ? "var(--success)" : "var(--danger)" }}>
                    {t.type === "income" ? "+" : "-"}
                    {formatEuro(t.amount)}
                  </strong>
                </td>
                <td className="right">
                  <form action={deleteTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="btn ghost sm">
                      ✕
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
