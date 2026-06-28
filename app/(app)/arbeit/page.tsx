import Link from "next/link";
import { getNotes } from "@/lib/services/notes";
import { getTodos } from "@/lib/services/todos";
import { createNote, togglePinNote } from "@/lib/actions/notes";
import { TodoList } from "@/components/todos/TodoList";
import { EmptyState } from "@/components/ui/Card";

export default async function ArbeitPage() {
  const [notes, todos] = await Promise.all([getNotes(), getTodos("arbeit")]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Arbeit/Master</h1>
          <p>Notizen und Aufgaben für Job und Studium.</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "var(--space-6)",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        <div>
          <h3 className="chart-title" style={{ marginBottom: "var(--space-3)" }}>
            Notizen
          </h3>
          <form action={createNote} style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
            <input className="input" name="title" placeholder="Neue Notiz…" required style={{ flex: 1 }} />
            <button type="submit" className="btn primary">
              +
            </button>
          </form>

          {notes.length === 0 ? (
            <EmptyState>Noch keine Notizen.</EmptyState>
          ) : (
            <div className="card-list">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="card"
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}
                >
                  <Link href={`/arbeit/notizen/${note.id}`} style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{note.title}</div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {note.content || "Kein Inhalt"}
                    </div>
                  </Link>
                  <form action={togglePinNote}>
                    <input type="hidden" name="id" value={note.id} />
                    <input type="hidden" name="pinned" value={String(note.pinned)} />
                    <button type="submit" className="btn ghost icon-only" title="Anpinnen">
                      {note.pinned ? "📌" : "📍"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="chart-title" style={{ marginBottom: "var(--space-3)" }}>
            To-Do&apos;s
          </h3>
          <TodoList area="arbeit" todos={todos} />
        </div>
      </div>
    </>
  );
}
