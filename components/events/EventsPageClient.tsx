"use client";

import { useState } from "react";
import { EventArea, EventRow } from "@/lib/types";
import { EventList } from "./EventList";
import { EventForm } from "./EventForm";

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

      <EventList events={events} onSelect={(event) => setEditing(event)} />

      {editing && (
        <EventForm
          area={area}
          event={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
