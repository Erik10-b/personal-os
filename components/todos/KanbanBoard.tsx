"use client";

import { TodoArea, TodoRow } from "@/lib/types";
import { createTodo, deleteTodo, setTodoPriority, setTodoUrgency, toggleTodo } from "@/lib/actions/todos";
import { PRIORITY_LEVELS, PRIORITY_META, URGENCY_TIERS, groupByUrgency } from "@/lib/todoUtils";
import { EmptyState } from "@/components/ui/Card";

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function KanbanBoard({ area, todos }: { area: TodoArea; todos: TodoRow[] }) {
  const done = todos.filter((t) => t.done);
  const columns = groupByUrgency(todos);

  return (
    <>
      <form
        action={createTodo}
        className="card"
        style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end", marginBottom: "var(--space-6)", flexWrap: "wrap" }}
      >
        <input type="hidden" name="area" value={area} />
        <div className="form-row" style={{ flex: 2, minWidth: 200 }}>
          <label htmlFor="kanban-title">Neue Aufgabe</label>
          <input className="input" id="kanban-title" name="title" placeholder="Was steht an?" required />
        </div>
        <div className="form-row">
          <label htmlFor="kanban-urgency">Tier</label>
          <select className="input" id="kanban-urgency" name="urgency" defaultValue="this_week">
            {URGENCY_TIERS.map((tier) => (
              <option key={tier.key} value={tier.key}>
                {tier.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="kanban-priority">Priorität</label>
          <select className="input" id="kanban-priority" name="priority" defaultValue="medium">
            {PRIORITY_LEVELS.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="kanban-due">Fällig</label>
          <input className="input mono" id="kanban-due" name="due_date" type="date" />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: 12, paddingBottom: 10 }}>
          <input type="checkbox" name="key" />
          Schlüsselaufgabe
        </label>
        <button type="submit" className="btn primary">
          Anlegen
        </button>
      </form>

      <div
        style={{
          display: "grid",
          gap: "var(--space-4)",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          marginBottom: "var(--space-6)",
        }}
      >
        {columns.map((col) => (
          <div key={col.key} className="card" style={{ minHeight: 120 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <h3 style={{ margin: 0, fontSize: 13 }}>{col.label}</h3>
              <span className="badge neutral">{col.todos.length}</span>
            </div>

            {col.todos.length === 0 ? (
              <EmptyState>Leer.</EmptyState>
            ) : (
              <div className="card-list">
                {col.todos.map((todo) => (
                  <div
                    key={todo.id}
                    style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", padding: "var(--space-2) 0" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)" }}>
                      <form action={toggleTodo}>
                        <input type="hidden" name="id" value={todo.id} />
                        <input type="hidden" name="area" value={area} />
                        <input type="hidden" name="done" value={String(todo.done)} />
                        <button type="submit" className="checkbox" aria-label="erledigt" />
                      </form>
                      <span style={{ flex: 1, fontSize: 13 }}>
                        {todo.key && <span title="Schlüsselaufgabe">⭐ </span>}
                        {todo.title}
                      </span>
                      <span className={`badge ${PRIORITY_META[todo.priority ?? "medium"].badge}`} title="Priorität">
                        {PRIORITY_META[todo.priority ?? "medium"].label}
                      </span>
                      <form action={deleteTodo}>
                        <input type="hidden" name="id" value={todo.id} />
                        <input type="hidden" name="area" value={area} />
                        <button type="submit" className="btn ghost sm">
                          ✕
                        </button>
                      </form>
                    </div>

                    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", paddingLeft: 30 }}>
                      {todo.due_date && (
                        <span className={`badge ${isOverdue(todo.due_date) ? "danger" : "neutral"} mono`}>
                          {new Date(todo.due_date).toLocaleDateString("de-DE")}
                        </span>
                      )}
                      <form action={setTodoUrgency} style={{ flex: 1 }}>
                        <input type="hidden" name="id" value={todo.id} />
                        <input type="hidden" name="area" value={area} />
                        <select
                          className="input mono"
                          name="urgency"
                          defaultValue={todo.urgency}
                          style={{ fontSize: 10, padding: "4px 8px" }}
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        >
                          {URGENCY_TIERS.map((tier) => (
                            <option key={tier.key} value={tier.key}>
                              {tier.label}
                            </option>
                          ))}
                        </select>
                      </form>
                      <form action={setTodoPriority}>
                        <input type="hidden" name="id" value={todo.id} />
                        <input type="hidden" name="area" value={area} />
                        <select
                          className="input mono"
                          name="priority"
                          defaultValue={todo.priority ?? "medium"}
                          style={{ fontSize: 10, padding: "4px 8px" }}
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                          title="Priorität ändern"
                        >
                          {PRIORITY_LEVELS.map((p) => (
                            <option key={p} value={p}>
                              {PRIORITY_META[p].label}
                            </option>
                          ))}
                        </select>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <details className="card">
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Erledigt ({done.length})
          </summary>
          <div className="card-list" style={{ marginTop: "var(--space-3)" }}>
            {done.map((todo) => (
              <div
                key={todo.id}
                style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-2) 0", opacity: 0.55 }}
              >
                <form action={toggleTodo}>
                  <input type="hidden" name="id" value={todo.id} />
                  <input type="hidden" name="area" value={area} />
                  <input type="hidden" name="done" value={String(todo.done)} />
                  <button type="submit" className="checkbox checked" aria-label="erledigt" />
                </form>
                <span style={{ flex: 1, fontSize: 13, textDecoration: "line-through" }}>{todo.title}</span>
                <form action={deleteTodo}>
                  <input type="hidden" name="id" value={todo.id} />
                  <input type="hidden" name="area" value={area} />
                  <button type="submit" className="btn ghost sm">
                    ✕
                  </button>
                </form>
              </div>
            ))}
          </div>
        </details>
      )}
    </>
  );
}
