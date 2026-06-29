"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { NetWorthSnapshotRow } from "@/lib/types";

function formatEuro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export function NetWorthChart({ snapshots }: { snapshots: NetWorthSnapshotRow[] }) {
  const data = snapshots.map((s) => ({
    date: new Date(s.snapshot_date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
    amount: s.amount / 100,
  }));

  return (
    <div className="chart-frame">
      <div className="chart-head">
        <span className="chart-title">Vermögensverlauf</span>
        <span className="chart-meta">{data.length} Snapshots</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(value) => formatEuro(Number(value) * 100)}
            contentStyle={{
              background: "var(--bg-surface-2)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="amount" stroke="var(--mod-finanzielles, #10B981)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
