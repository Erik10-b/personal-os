"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PALETTE = [
  "var(--mod-finanzielles)",
  "var(--blue)",
  "var(--purple)",
  "var(--orange)",
  "var(--teal)",
  "var(--gold)",
];

function formatEuro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export function ExpenseByCategoryChart({
  data,
}: {
  data: { category: string; amount: number }[];
}) {
  return (
    <div className="chart-frame">
      <div className="chart-head">
        <span className="chart-title">Ausgaben nach Kategorie</span>
        <span className="chart-meta">Dieser Monat</span>
      </div>
      {data.length === 0 ? (
        <div className="empty-state">Keine Ausgaben diesen Monat.</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="amount" nameKey="category" innerRadius={50} outerRadius={90}>
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatEuro(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {data.map((d, i) => (
              <span key={d.category} className="item">
                <span className="swatch" style={{ background: PALETTE[i % PALETTE.length] }} />
                {d.category} · {formatEuro(d.amount)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function MonthlyTrendChart({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  return (
    <div className="chart-frame">
      <div className="chart-head">
        <span className="chart-title">Einnahmen vs. Ausgaben</span>
        <span className="chart-meta">Letzte {data.length} Monate</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickFormatter={(v) => String(Number(v) / 100)} />
          <Tooltip formatter={(value) => formatEuro(Number(value))} />
          <Bar dataKey="income" fill="var(--success)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="var(--danger)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
