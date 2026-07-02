"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { WorkoutSessionWithExercises } from "@/lib/services/training";
import { bestSet, exerciseVolume, formatWeight } from "@/lib/trainingUtils";

export function TrainingProgress({ sessions }: { sessions: WorkoutSessionWithExercises[] }) {
  const sorted = useMemo(
    () => [...sessions].sort((a, b) => a.session_date.localeCompare(b.session_date)),
    [sessions]
  );

  const exerciseNames = useMemo(() => {
    const set = new Set<string>();
    for (const s of sorted) for (const ex of s.exercises) set.add(ex.name);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "de"));
  }, [sorted]);

  const [selected, setSelected] = useState(exerciseNames[0] ?? "");
  const activeExercise = exerciseNames.includes(selected) ? selected : exerciseNames[0] ?? "";

  const weightData = useMemo(() => {
    return sorted.flatMap((s) =>
      s.exercises
        .filter((ex) => ex.name === activeExercise)
        .map((ex) => ({
          date: new Date(s.session_date + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
          weight: bestSet(ex).weight_kg,
        }))
    );
  }, [sorted, activeExercise]);

  const volumeData = useMemo(() => {
    return sorted.map((s) => ({
      date: new Date(s.session_date + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      volume: s.exercises.reduce((sum, ex) => sum + exerciseVolume(ex), 0),
    }));
  }, [sorted]);

  if (sorted.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: "var(--space-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
        <span className="habit-section-label" style={{ marginBottom: 0 }}>VERLAUF — GEWICHT PRO ÜBUNG</span>
        <select
          className="input mono"
          value={activeExercise}
          onChange={(e) => setSelected(e.target.value)}
          style={{ maxWidth: 220, fontSize: 11, padding: "6px 10px" }}
        >
          {exerciseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={weightData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} domain={["auto", "auto"]} unit="kg" />
          <Tooltip
            formatter={(value) => `${formatWeight(Number(value))} kg`}
            contentStyle={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 12 }}
          />
          <Line type="monotone" dataKey="weight" stroke="var(--club)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ marginTop: "var(--space-6)" }}>
        <span className="habit-section-label">GESAMT-TRAININGSVOLUMEN (SÄTZE × WDH. × GEWICHT)</span>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={volumeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} domain={["auto", "auto"]} />
            <Tooltip
              formatter={(value) => `${Math.round(Number(value)).toLocaleString("de-DE")} kg`}
              contentStyle={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 12 }}
            />
            <Line type="monotone" dataKey="volume" stroke="var(--success)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
