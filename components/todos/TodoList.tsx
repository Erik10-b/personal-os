import { SubmitButton } from "@/components/ui/SubmitButton";
import { OptimisticToggle } from "@/components/ui/OptimisticToggle";
import { TodoArea, TodoRow } from "@/lib/types";
import { createTodo, deleteTodo, toggleTodo } from "@/lib/actions/todos";
import { EmptyState } from "@/components/ui/Card";

function isOverdue(dueDate: string | null, done: boolean) {
  if (!dueDate || done) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function TodoList({ area, todos }: { area: TodoArea; todos: TodoRow[] }) {
  return (
    <div className="card">
      <form action={createTodo} style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        <input type="hidden" name="area" value={area} />
        <input className="input" name="title" placeholder="Neue Aufgabe…" required style={{ flex: 1 }} />
        <input className="input mono" name="due_date" type="date" style={{ maxWidth: 160 }} />
        <SubmitButton type="submit" className="btn primary">
          +
        </SubmitButton>
      </form>

      {todos.length === 0 ? (
        <EmptyState>Keine offenen Aufgaben.</EmptyState>
      ) : (
        <div className="card-list">
          {todos.map((todo) => (
            <div
              key={todo.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-2) 0",
                opacity: todo.done ? 0.55 : 1,
              }}
            >
              <OptimisticToggle action={toggleTodo} values={{ id: todo.id, area: area }} checked={todo.done} field="done" label={todo.title}/>

              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  textDecoration: todo.done ? "line-through" : "none",
                }}
              >
                {todo.title}
              </span>

              {todo.due_date && (
                <span className={`badge ${isOverdue(todo.due_date, todo.done) ? "danger" : "neutral"}`}>
                  {new Date(todo.due_date).toLocaleDateString("de-DE")}
                </span>
              )}

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
      )}
    </div>
  );
}
