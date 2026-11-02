import { SubmitButton } from "@/components/ui/SubmitButton";
import { OptimisticToggle } from "@/components/ui/OptimisticToggle";
import { GoalRow, GoalScope } from "@/lib/types";
import { createGoal, deleteGoal, toggleGoal } from "@/lib/actions/goals";
import { EmptyState } from "@/components/ui/Card";

export function GoalSection({
  scope,
  title,
  goals,
}: {
  scope: GoalScope;
  title: string;
  goals: GoalRow[];
}) {
  return (
    <div className="card">
      <div style={{ marginBottom: "var(--space-3)" }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>{title}</h3>
      </div>

      <form action={createGoal} style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        <input type="hidden" name="scope" value={scope} />
        <input className="input" name="title" placeholder="Neues Ziel…" required style={{ flex: 1 }} />
        <SubmitButton type="submit" className="btn primary">
          +
        </SubmitButton>
      </form>

      {goals.length === 0 ? (
        <EmptyState>Noch keine Ziele.</EmptyState>
      ) : (
        <div className="card-list">
          {goals.map((goal) => (
            <div
              key={goal.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-2) 0",
                opacity: goal.done ? 0.55 : 1,
              }}
            >
              <OptimisticToggle action={toggleGoal} values={{ id: goal.id }} checked={goal.done} field="done" label={goal.title}/>

              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  textDecoration: goal.done ? "line-through" : "none",
                }}
              >
                {goal.title}
              </span>

              <form action={deleteGoal}>
                <input type="hidden" name="id" value={goal.id} />
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
