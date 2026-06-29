import { createClient } from "@/lib/supabase/server";
import { GoalRow, GoalScope } from "@/lib/types";

export async function getGoals(scope: GoalScope): Promise<GoalRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("scope", scope)
    .order("done", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
