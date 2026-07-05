"use client";

import { useMemo, useState } from "react";
import { EventRow } from "@/lib/types";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pillClassFor(event: EventRow): string {
  const cat = (event.category ?? "").toLowerCase();
  if (cat.includes("fußball") || cat.includes("fussball")) return "spiel";
  if (cat.includes("uni")) return "training";
  if (cat.includes("persönlich") || cat.includes("persoenlich")) return "geburtstag";
  if (cat.includes("arbeit")) return "arbeit";
  return "event";
}

function buildMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Montag = 0
  const gridStart = new Date(year, month, 1 - startOffset);

  const days: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push({ date: d, inMonth: d.getMonth() === month });
  }
  return days;
}

export function CalendarView({
  events,
  onSelectDay,
  onSelectEvent,
}: {
  events: EventRow[];
  onSelectDay: (dateKey: string) => void;
  onSelectEvent: (event: EventRow) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(toDateKey(today));

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const event of events) {
      const start = new Date(event.starts_at);
      // Enddatum: falls gesetzt, bis dahin (inkl.), sonst nur der Starttag
      const end = event.ends_at ? new Date(event.ends_at) : start;
      const cursorDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      // Sicherheitslimit gegen fehlerhafte Daten
      let guard = 0;
      while (cursorDay <= lastDay && guard < 400) {
        const key = toDateKey(cursorDay);
        const list = map.get(key) ?? [];
        list.push(event);
        map.set(key, list);
        cursorDay.setDate(cursorDay.getDate() + 1);
        guard++;
      }
    }
    return map;
  }, [events]);

  const days = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const monthLabel = cursor.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  const selectedDate = new Date(selected + "T00:00:00");
  const selectedEvents = (eventsByDay.get(selected) ?? []).sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );

  function selectDay(dateKey: string) {
    setSelected(dateKey);
    onSelectDay(dateKey);
  }

  function shiftMonth(delta: number) {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  }

  function goToday() {
    const t = new Date();
    setCursor(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelected(toDateKey(t));
  }

  return (
    <>
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => shiftMonth(-1)} aria-label="Vorheriger Monat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="cal-month-label">{monthLabel}</span>
          <button className="cal-nav-btn" onClick={() => shiftMonth(1)} aria-label="Nächster Monat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <button className="cal-today-btn" onClick={goToday}>
          Heute
        </button>
      </div>

      <div className="cal-layout">
        <div className="cal-grid-card">
          <div className="cal-weekdays">
            {WEEKDAYS.map((day, i) => (
              <div key={day} className={`cal-weekday ${i >= 5 ? "weekend" : ""}`}>
                {day}
              </div>
            ))}
          </div>
          <div className="cal-grid">
            {days.map(({ date, inMonth }) => {
              const key = toDateKey(date);
              const dayEvents = eventsByDay.get(key) ?? [];
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isToday = key === toDateKey(today);
              const isSelected = key === selected;
              const visiblePills = dayEvents.slice(0, 2);
              const more = dayEvents.length - visiblePills.length;

              return (
                <div
                  key={key}
                  className={[
                    "cal-day",
                    !inMonth ? "muted" : "",
                    isWeekend ? "weekend" : "",
                    isToday ? "today" : "",
                    isSelected ? "selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => inMonth && selectDay(key)}
                >
                  <span className="cal-day-num">{date.getDate()}</span>
                  {visiblePills.length > 0 && (
                    <div className="cal-events">
                      {visiblePills.map((event) => (
                        <span key={event.id} className={`cal-event-pill ${pillClassFor(event)}`}>
                          <span className="dot" />
                          <span className="text">{event.title}</span>
                        </span>
                      ))}
                      {more > 0 && <span className="cal-day-more">+{more} mehr</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="cal-detail">
          <div>
            <div className="cal-detail-eyebrow">Ausgewählter Tag</div>
            <div className="cal-detail-date">
              {selectedDate.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
            </div>
            <div className="cal-detail-meta">
              {selectedDate.toLocaleDateString("de-DE", { weekday: "long" })}
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="cal-empty">
              <div className="cal-empty-icon">🗓️</div>
              <div className="cal-empty-text">Keine Termine an diesem Tag.</div>
            </div>
          ) : (
            <div className="cal-events-list">
              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className={`cal-event-card ${pillClassFor(event)}`}
                  onClick={() => onSelectEvent(event)}
                >
                  <div className="cal-event-time">
                    {new Date(event.starts_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="cal-event-info">
                    <div className="cal-event-title">{event.title}</div>
                    {event.category && <div className="cal-event-sub">{event.category}</div>}
                  </div>
                  <div className="cal-event-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
