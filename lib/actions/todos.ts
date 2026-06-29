"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TodoArea, TodoUrgency } from "@/lib/types";

function pathForArea(area: TodoArea) {
  return area === "arbeit" ? "/arbeit" : "/erik/todos";
}

export async function createTodo(formData: FormData) {
  const area = String(formData.get("area")) as TodoArea;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const urgency = (formData.get("urgency") as TodoUrgency) || "this_week";

  const { error } = await supabase.from("todos").insert({
    user_id: userData.user.id,
    area,
    title: String(formData.get("title")),
    due_date: formData.get("due_date") ? String(formData.get("due_date")) : null,
    urgency,
    key: formData.get("key") === "on",
  });

  if (error) throw error;
  revalidatePath(pathForArea(area));
  revalidatePath("/heute");
}

export async function setTodoUrgency(formData: FormData) {
  const id = String(formData.get("id"));
  const area = String(formData.get("area")) as TodoArea;
  const urgency = formData.get("urgency") as TodoUrgency;
  const supabase = await createClient();

  const { error } = await supabase.from("todos").update({ urgency }).eq("id", id);
  if (error) throw error;
  revalidatePath(pathForArea(area));
}

export async function toggleTodo(formData: FormData) {
  const id = String(formData.get("id"));
  const area = String(formData.get("area")) as TodoArea;
  const done = formData.get("done") === "true";
  const supabase = await createClient();

  const { error } = await supabase.from("todos").update({ done: !done }).eq("id", id);
  if (error) throw error;
  revalidatePath(pathForArea(area));
  revalidatePath("/heute");
}

export async function deleteTodo(formData: FormData) {
  const id = String(formData.get("id"));
  const area = String(formData.get("area")) as TodoArea;
  const supabase = await createClient();

  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(pathForArea(area));
}
