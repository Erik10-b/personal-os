import { createClient } from "@/lib/supabase/server";
import { TodoArea, TodoRow } from "@/lib/types";

export async function getTodos(area: TodoArea): Promise<TodoRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("area", area)
    .order("done", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
