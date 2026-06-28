"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const amountEuro = Number(formData.get("amount"));

  const { error } = await supabase.from("transactions").insert({
    user_id: userData.user.id,
    type: String(formData.get("type")),
    amount: Math.round(amountEuro * 100),
    category: String(formData.get("category")),
    occurred_on: String(formData.get("occurred_on")),
    note: formData.get("note") ? String(formData.get("note")) : null,
  });

  if (error) throw error;
  revalidatePath("/finanzielles");
  redirect("/finanzielles");
}

export async function deleteTransaction(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/finanzielles");
}
