import { createClient } from "@/lib/supabase/server";
import { WeightLogRow } from "@/lib/types";

export async function getWeightLogs(limit = 90): Promise<WeightLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .order("logged_on", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).reverse();
}
