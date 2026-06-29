"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertNetWorthSnapshot(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const amountEuro = Number(formData.get("amount"));

  const { error } = await supabase.from("net_worth_snapshots").upsert(
    {
      user_id: userData.user.id,
      snapshot_date: String(formData.get("snapshot_date")),
      amount: Math.round(amountEuro * 100),
      note: formData.get("note") ? String(formData.get("note")) : null,
    },
    { onConflict: "user_id,snapshot_date" }
  );

  if (error) throw error;
  revalidatePath("/finanzielles");
}

export async function deleteNetWorthSnapshot(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("net_worth_snapshots").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/finanzielles");
}
