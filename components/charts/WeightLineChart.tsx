"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { WeightLogRow } from "@/lib/types";

export function WeightLineChart({ logs }: { logs: WeightLogRow[] }) {
  const data = logs.map((l) => ({
    date: new Date(l.logged_on).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
    kg: l.weight_kg,
  }));

  return (
    <div className="chart-frame">
      <div className="chart-head">
        <span className="chart-title">Gewichtsverlauf</span>
        <span className="chart-meta">{data.length} Einträge</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              background: "var(--bg-surface-2)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="kg" stroke="var(--mod-erik, #3B82F6)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
