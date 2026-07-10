"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "strichliste:v1";
const DEFAULT_NAMES = [
  "Person 1",
  "Person 2",
  "Person 3",
  "Person 4",
  "Person 5",
  "Person 6",
  "Person 7",
  "Person 8",
];

interface StrichlisteState {
  names: string[];
  counts: number[];
}

function loadState(): StrichlisteState {
  if (typeof window === "undefined") {
    return { names: DEFAULT_NAMES, counts: DEFAULT_NAMES.map(() => 0) };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as StrichlisteState;
    if (
      Array.isArray(parsed.names) &&
      Array.isArray(parsed.counts) &&
      parsed.names.length === 8 &&
      parsed.counts.length === 8
    ) {
      return parsed;
    }
    throw new Error("invalid shape");
  } catch {
    return { names: DEFAULT_NAMES, counts: DEFAULT_NAMES.map(() => 0) };
  }
}

function TallyMarks({ count }: { count: number }) {
  const bundles = Math.floor(count / 5);
  const remainder = count % 5;
  if (count === 0) {
    return <span className="tally-empty">—</span>;
  }
  return (
    <span className="tally-marks">
      {Array.from({ length: bundles }).map((_, i) => (
        <span className="tally-bundle" key={`b${i}`}>
          <span className="tally-stroke s1" />
          <span className="tally-stroke s2" />
          <span className="tally-stroke s3" />
          <span className="tally-stroke s4" />
          <span className="tally-stroke s5" />
        </span>
      ))}
      {remainder > 0 && (
        <span className="tally-bundle partial">
          {Array.from({ length: remainder }).map((_, i) => (
            <span className={`tally-stroke s${i + 1}`} key={`r${i}`} />
          ))}
        </span>
      )}
    </span>
  );
}

export default function StrichlistePage() {
  const [state, setState] = useState<StrichlisteState>({
    names: DEFAULT_NAMES,
    counts: DEFAULT_NAMES.map(() => 0),
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  function increment(index: number) {
    setState((prev) => {
      const counts = [...prev.counts];
      counts[index] += 1;
      return { ...prev, counts };
    });
  }

  function decrement(index: number) {
    setState((prev) => {
      const counts = [...prev.counts];
      counts[index] = Math.max(0, counts[index] - 1);
      return { ...prev, counts };
    });
  }

  function rename(index: number, value: string) {
    setState((prev) => {
      const names = [...prev.names];
      names[index] = value.trim() || DEFAULT_NAMES[index];
      return { ...prev, names };
    });
  }

  function resetAll() {
    if (!window.confirm("Alle Zähler auf 0 zurücksetzen?")) return;
    setState((prev) => ({ ...prev, counts: prev.counts.map(() => 0) }));
  }

  const total = state.counts.reduce((sum, c) => sum + c, 0);

  return (
    <div className="strichliste-shell">
      <div className="page-head">
        <div>
          <h1>Strichliste</h1>
          <p>Namen antippen zum Zählen. Namen lassen sich per Stift-Symbol umbenennen.</p>
        </div>
      </div>

      <div className="name-grid">
        {state.names.map((name, i) => (
          <button
            key={i}
            className="name-btn"
            onClick={() => increment(i)}
            aria-label={`${name} zählen`}
          >
            <span className="name-btn-label">{name}</span>
            <span className="name-btn-count">{state.counts[i]}</span>
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop: "var(--space-6)" }}>
        <table className="k-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Striche</th>
              <th className="right">Anzahl</th>
              <th className="right"></th>
            </tr>
          </thead>
          <tbody>
            {state.names.map((name, i) => (
              <tr key={i}>
                <td>
                  {editingIndex === i ? (
                    <input
                      className="input"
                      autoFocus
                      defaultValue={name}
                      onBlur={(e) => {
                        rename(i, e.target.value);
                        setEditingIndex(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditingIndex(null);
                      }}
                    />
                  ) : (
                    <span className="row-name">
                      <strong>{name}</strong>
                      <button
                        className="edit-name-btn"
                        onClick={() => setEditingIndex(i)}
                        aria-label={`${name} umbenennen`}
                        title="Umbenennen"
                      >
                        ✎
                      </button>
                    </span>
                  )}
                </td>
                <td>
                  <TallyMarks count={state.counts[i]} />
                </td>
                <td className="right mono">
                  <strong>{state.counts[i]}</strong>
                </td>
                <td className="right">
                  <button
                    className="btn ghost sm"
                    onClick={() => decrement(i)}
                    disabled={state.counts[i] === 0}
                    aria-label={`${name} minus eins`}
                  >
                    −1
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="strichliste-footer">
        <span className="strichliste-total">Gesamt: {total}</span>
        <button className="btn danger sm" onClick={resetAll}>
          Alle zurücksetzen
        </button>
      </div>
    </div>
  );
}
