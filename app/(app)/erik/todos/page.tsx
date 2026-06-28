import { getTodos } from "@/lib/services/todos";
import { TodoList } from "@/components/todos/TodoList";

export default async function ErikTodosPage() {
  const todos = await getTodos("erik");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>To-Do&apos;s</h1>
          <p>Persönliche Aufgaben.</p>
        </div>
      </div>
      <TodoList area="erik" todos={todos} />
    </>
  );
}
