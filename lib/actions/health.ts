"use server";

import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function changeHealthConnection(revoke: boolean) {
  const db = await createClient();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return { error: "Bitte erneut anmelden." };
  if (revoke) {
    const { error } = await db.from("health_sync_tokens").delete().eq("user_id", user.id);
    if (error) return { error: "Verbindung konnte nicht getrennt werden. Bitte erneut versuchen." };
    revalidatePath("/erik/health");
    return { revoked: true };
  }
  const token = randomBytes(32).toString("hex");
  const token_hash = createHash("sha256").update(token).digest("hex");
  const { error } = await db.from("health_sync_tokens").upsert({ user_id: user.id, token_hash, created_at: new Date().toISOString(), last_used_at: null });
  if (error) return { error: "Schlüssel konnte nicht erzeugt werden. Bitte Migration 0015 und Verbindung prüfen." };
  revalidatePath("/erik/health");
  return { token };
}
