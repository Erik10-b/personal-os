import { getTodos } from "@/lib/services/todos";
import { KanbanBoard } from "@/components/todos/KanbanBoard";

export default async function ErikTodosPage() {
  const todos = await getTodos("erik");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>To-Do&apos;s</h1>
          <p>Persönliche Aufgaben nach Dringlichkeit sortiert.</p>
        </div>
      </div>
      <KanbanBoard area="erik" todos={todos} />
    </>
  );
}
