import { getGoals } from "@/lib/services/goals";
import { GoalSection } from "@/components/goals/GoalSection";

export default async function GoalsPage() {
  const [weekGoals, monthGoals] = await Promise.all([getGoals("week"), getGoals("month")]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ziele</h1>
          <p>Wochen- und Monatsziele, bleiben bestehen bis du sie abhakst oder löschst.</p>
        </div>
      </div>

      <div className="module-grid">
        <GoalSection scope="week" title="Diese Woche" goals={weekGoals} />
        <GoalSection scope="month" title="Dieser Monat" goals={monthGoals} />
      </div>
    </>
  );
}
