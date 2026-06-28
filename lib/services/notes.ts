import { createClient } from "@/lib/supabase/server";
import { NoteRow } from "@/lib/types";

export async function getNotes(): Promise<NoteRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getNote(id: string): Promise<NoteRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("notes").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}
