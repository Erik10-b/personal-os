"use client";

import { useState } from "react";
import { EventArea, EventRow } from "@/lib/types";
import { EventList } from "./EventList";
import { EventForm } from "./EventForm";
import { CalendarView } from "./CalendarView";

export function EventsPageClient({
  area,
  title,
  description,
  events,
}: {
  area: EventArea;
  title: string;
  description: string;
  events: EventRow[];
}) {
  const [editing, setEditing] = useState<EventRow | null | "new">(null);
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button className="btn primary" onClick={() => setEditing("new")}>
          + Neuer Termin
        </button>
      </div>

      <div className="cal-mode-pill" style={{ marginBottom: "var(--space-5)" }}>
        <button
          className={`cal-mode-btn ${mode === "calendar" ? "active" : ""}`}
          onClick={() => setMode("calendar")}
          type="button"
        >
          Kalender
        </button>
        <button
          className={`cal-mode-btn ${mode === "list" ? "active" : ""}`}
          onClick={() => setMode("list")}
          type="button"
        >
          Liste
        </button>
      </div>

      {mode === "calendar" ? (
        <CalendarView
          events={events}
          onSelectDay={(dateKey) => setSelectedDate(dateKey)}
          onSelectEvent={(event) => setEditing(event)}
        />
      ) : (
        <EventList events={events} onSelect={(event) => setEditing(event)} />
      )}

      {editing && (
        <EventForm
          area={area}
          event={editing === "new" ? undefined : editing}
          defaultDate={editing === "new" ? selectedDate : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
