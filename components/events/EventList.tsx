"use client";

import { EventRow } from "@/lib/types";
import { EmptyState } from "@/components/ui/Card";

function formatDayHeading(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function EventList({
  events,
  onSelect,
}: {
  events: EventRow[];
  onSelect: (event: EventRow) => void;
}) {
  if (events.length === 0) {
    return <EmptyState>Noch keine Einträge.</EmptyState>;
  }

  const groups = new Map<string, EventRow[]>();
  for (const event of events) {
    const key = formatDayHeading(new Date(event.starts_at));
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }

  return (
    <div className="card-list">
      {Array.from(groups.entries()).map(([day, items]) => (
        <div key={day}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-tertiary)",
              margin: "var(--space-4) 0 var(--space-2)",
            }}
          >
            {day}
          </div>
          <div className="card-list">
            {items.map((event) => (
              <button
                key={event.id}
                onClick={() => onSelect(event)}
                className="card"
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-4)",
                  padding: "var(--space-4) var(--space-5)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--club)",
                    minWidth: 48,
                  }}
                >
                  {formatTime(new Date(event.starts_at))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{event.title}</div>
                  {event.note && (
                    <div style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                      {event.note}
                    </div>
                  )}
                </div>
                {event.category && <span className="badge club">{event.category}</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
