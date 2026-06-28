import { notFound } from "next/navigation";
import Link from "next/link";
import { getNote } from "@/lib/services/notes";
import { deleteNote, updateNote } from "@/lib/actions/notes";

export default async function NotizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) notFound();

  return (
    <>
      <div className="page-head">
        <Link href="/arbeit" className="btn ghost sm" style={{ marginBottom: "var(--space-3)" }}>
          ← Zurück
        </Link>
      </div>

      <form action={updateNote} className="form-grid" style={{ maxWidth: 720 }}>
        <input type="hidden" name="id" value={note.id} />
        <div className="form-row">
          <label htmlFor="title">Titel</label>
          <input className="input" id="title" name="title" defaultValue={note.title} required />
        </div>
        <div className="form-row">
          <label htmlFor="content">Inhalt</label>
          <textarea
            className="textarea"
            id="content"
            name="content"
            defaultValue={note.content}
            style={{ minHeight: 320 }}
          />
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button type="submit" className="btn primary">
            Speichern
          </button>
        </div>
      </form>

      <form action={deleteNote} style={{ marginTop: "var(--space-6)" }}>
        <input type="hidden" name="id" value={note.id} />
        <button type="submit" className="btn danger">
          Notiz löschen
        </button>
      </form>
    </>
  );
}
