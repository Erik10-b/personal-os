import { createClient } from "@/lib/supabase/server";
import { EventArea, EventRow } from "@/lib/types";

export async function getEvents(area: EventArea): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("area", area)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
