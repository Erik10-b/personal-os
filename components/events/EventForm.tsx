"use client";

import { Modal } from "@/components/ui/Modal";
import { EventArea, EventRow } from "@/lib/types";
import { createEvent, deleteEvent, updateEvent } from "@/lib/actions/events";

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  area,
  event,
  onClose,
}: {
  area: EventArea;
  event?: EventRow;
  onClose: () => void;
}) {
  const isEdit = Boolean(event);

  async function action(formData: FormData) {
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
            defaultValue={event?.title}
            placeholder={area === "fussball" ? "z.B. Training, Heimspiel" : "z.B. Zahnarzt"}
          />
        </div>

        <div className="form-row">
          <label htmlFor="starts_at">
            Start <span className="req">*</span>
          </label>
          <input
            className="input mono"
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={toLocalInputValue(event?.starts_at ?? null)}
          />
        </div>

        <div className="form-row">
          <label htmlFor="ends_at">Ende</label>
          <input
            className="input mono"
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocalInputValue(event?.ends_at ?? null)}
          />
        </div>

        <div className="form-row">
          <label htmlFor="category">Kategorie</label>
          <input
            className="input"
            id="category"
            name="category"
            defaultValue={event?.category ?? ""}
            placeholder={area === "fussball" ? "Training / Spiel" : "z.B. Arzt, Privat"}
          />
        </div>

        <div className="form-row">
          <label htmlFor="note">Notiz</label>
          <textarea className="textarea" id="note" name="note" defaultValue={event?.note ?? ""} />
        </div>

        <button type="submit" className="btn primary block">
          {isEdit ? "Speichern" : "Anlegen"}
        </button>
      </form>
    </Modal>
  );
}
