"use client";

import { Modal } from "@/components/ui/Modal";
import { EventArea, EventRow } from "@/lib/types";
import { createEvent, deleteEvent, updateEvent } from "@/lib/actions/events";

const CATEGORIES: { label: string; color: string }[] = [
  { label: "Persönlich", color: "var(--purple)" },
  { label: "Arbeit", color: "var(--orange)" },
  { label: "Uni", color: "var(--blue-bright)" },
  { label: "Event", color: "var(--warning)" },
  { label: "Fußball", color: "var(--success)" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  area,
  event,
  defaultDate,
  onClose,
}: {
  area: EventArea;
  event?: EventRow;
  defaultDate?: string;
  onClose: () => void;
}) {
  const isEdit = Boolean(event);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const startDate = toLocalDate(event?.starts_at ?? null) || defaultDate || todayStr;
  const startTime = toLocalTime(event?.starts_at ?? null) || "09:00";
  const endDate = toLocalDate(event?.ends_at ?? null);
  const endTime = toLocalTime(event?.ends_at ?? null);

  async function action(formData: FormData) {
    // Datum + Uhrzeit clientseitig zu echten UTC-Zeitpunkten kombinieren,
    // damit die Uhrzeit unabhängig von der Server-Zeitzone stimmt.
    const sDate = String(formData.get("start_date"));
    const sTime = String(formData.get("start_time") || "09:00");
    formData.set("starts_at", new Date(`${sDate}T${sTime}`).toISOString());

    const eDate = String(formData.get("end_date") || "");
    if (eDate) {
      const eTime = String(formData.get("end_time") || sTime);
      formData.set("ends_at", new Date(`${eDate}T${eTime}`).toISOString());
    }

    if (isEdit) {
      await updateEvent(formData);
    } else {
      await createEvent(formData);
    }
    onClose();
  }

  async function remove() {
    if (!event) return;
    const formData = new FormData();
    formData.set("id", event.id);
    formData.set("area", area);
    await deleteEvent(formData);
    onClose();
  }

  return (
    <Modal
      title={isEdit ? "Termin bearbeiten" : "Neuer Termin"}
      eyebrow={area === "fussball" ? "Fußball" : "Termine"}
      icon={
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      }
      onClose={onClose}
      footer={
        isEdit ? (
          <button className="btn danger" onClick={remove} type="button">
            Löschen
          </button>
        ) : undefined
      }
    >
      <form action={action} className="form-grid">
        <input type="hidden" name="area" value={area} />
        {event && <input type="hidden" name="id" value={event.id} />}

        <div className="form-row">
          <label htmlFor="title">
            Titel <span className="req">*</span>
          </label>
          <input
            className="input"
            id="title"
            name="title"
            required
            autoFocus={!isEdit}
            defaultValue={event?.title}
            placeholder="z.B. Zahnarzt, Heimspiel, Klausur"
          />
        </div>

        <div className="form-row">
          <label>Kategorie</label>
          <div className="choice-pills">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.label}
                className="choice-pill"
                style={{ "--pill-color": cat.color } as React.CSSProperties}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.label}
                  defaultChecked={(event?.category ?? "Persönlich") === cat.label}
                />
                <span className="dot" />
                {cat.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <div className="form-row" style={{ flex: 1.4 }}>
            <label htmlFor="start_date">
              Datum <span className="req">*</span>
            </label>
            <input className="input mono" id="start_date" name="start_date" type="date" required defaultValue={startDate} />
          </div>
          <div className="form-row" style={{ flex: 1 }}>
            <label htmlFor="start_time">Uhrzeit</label>
            <input className="input mono" id="start_time" name="start_time" type="time" defaultValue={startTime} />
          </div>
        </div>

        <details open={Boolean(event?.ends_at)}>
          <summary
            style={{
              cursor: "pointer",
              fontSize: 11.5,
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}
          >
            Ende / mehrtägig
          </summary>
          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            <div className="form-row" style={{ flex: 1.4 }}>
              <label htmlFor="end_date">End-Datum</label>
              <input className="input mono" id="end_date" name="end_date" type="date" defaultValue={endDate} />
            </div>
            <div className="form-row" style={{ flex: 1 }}>
              <label htmlFor="end_time">End-Uhrzeit</label>
              <input className="input mono" id="end_time" name="end_time" type="time" defaultValue={endTime} />
            </div>
          </div>
        </details>

        <div className="form-row">
          <label htmlFor="note">Notiz</label>
          <textarea className="textarea" id="note" name="note" defaultValue={event?.note ?? ""} placeholder="optional" />
        </div>

        <button type="submit" className="btn primary block" style={{ minHeight: 46 }}>
          {isEdit ? "Speichern" : "Termin anlegen"}
        </button>
      </form>
    </Modal>
  );
}
