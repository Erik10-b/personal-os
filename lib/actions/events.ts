"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EventArea } from "@/lib/types";

function pathForArea(area: EventArea) {
  return area === "fussball" ? "/fussball" : "/termine";
}

export async function createEvent(formData: FormData) {
  const area = String(formData.get("area")) as EventArea;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const { error } = await supabase.from("events").insert({
    user_id: userData.user.id,
    area,
    title: String(formData.get("title")),
    starts_at: String(formData.get("starts_at")),
    ends_at: formData.get("ends_at") ? String(formData.get("ends_at")) : null,
    note: formData.get("note") ? String(formData.get("note")) : null,
    category: formData.get("category") ? String(formData.get("category")) : null,
  });

  if (error) throw error;
  revalidatePath(pathForArea(area));
}

export async function updateEvent(formData: FormData) {
  const id = String(formData.get("id"));
  const area = String(formData.get("area")) as EventArea;
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({
      title: String(formData.get("title")),
      starts_at: String(formData.get("starts_at")),
      ends_at: formData.get("ends_at") ? String(formData.get("ends_at")) : null,
      note: formData.get("note") ? String(formData.get("note")) : null,
      category: formData.get("category") ? String(formData.get("category")) : null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath(pathForArea(area));
}

export async function deleteEvent(formData: FormData) {
  const id = String(formData.get("id"));
  const area = String(formData.get("area")) as EventArea;
  const supabase = await createClient();

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(pathForArea(area));
}
