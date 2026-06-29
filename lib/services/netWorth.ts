import { createClient } from "@/lib/supabase/server";
import { NetWorthSnapshotRow } from "@/lib/types";

export async function getNetWorthSnapshots(limit = 24): Promise<NetWorthSnapshotRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("net_worth_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).reverse();
}
