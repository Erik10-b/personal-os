"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createNote(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userData.user.id,
      title: String(formData.get("title") || "Ohne Titel"),
      content: "",
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath("/arbeit");
  redirect(`/arbeit/notizen/${data.id}`);
}

export async function updateNote(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase
    .from("notes")
    .update({
      title: String(formData.get("title") || "Ohne Titel"),
      content: String(formData.get("content") ?? ""),
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/arbeit");
  revalidatePath(`/arbeit/notizen/${id}`);
}

export async function togglePinNote(formData: FormData) {
  const id = String(formData.get("id"));
  const pinned = formData.get("pinned") === "true";
  const supabase = await createClient();

  const { error } = await supabase.from("notes").update({ pinned: !pinned }).eq("id", id);
  if (error) throw error;
  revalidatePath("/arbeit");
}

export async function deleteNote(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/arbeit");
  redirect("/arbeit");
}
