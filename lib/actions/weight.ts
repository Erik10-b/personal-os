"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logWeight(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nicht angemeldet");

  const logged_on = String(formData.get("logged_on"));
  const weight_kg = Number(formData.get("weight_kg"));

  const { error } = await supabase
    .from("weight_logs")
    .upsert(
      { user_id: userData.user.id, logged_on, weight_kg },
      { onConflict: "user_id,logged_on" }
    );

  if (error) throw error;
  revalidatePath("/erik/gewicht");
  revalidatePath("/erik");
}
