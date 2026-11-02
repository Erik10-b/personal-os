import { createClient } from "@supabase/supabase-js";
import { readLimitedJson, validateHealthSnapshot } from "@/lib/healthSync";

export const runtime = "nodejs";
const reply = (status: number, message: string, ok = false) => Response.json({ ok, message }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const match = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get("authorization") ?? "");
  if (!match) return reply(401, "Verbindungsschlüssel fehlt oder ist ungültig.");
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return reply(415, "Bitte application/json senden.");
  let raw;
  try { raw = await readLimitedJson(request); }
  catch (error) { return error instanceof Error && error.message === "too_large" ? reply(413, "Anfrage zu groß.") : reply(400, "Ungültiges JSON."); }
  let snapshot;
  try { snapshot = validateHealthSnapshot(raw); }
  catch (error) { return reply(400, error instanceof Error ? error.message : "Ungültige Health-Werte."); }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return reply(503, "Health-Verbindung ist noch nicht eingerichtet.");
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.rpc("receive_health_snapshot", {
      p_token: match[1], p_day: snapshot.date, p_observed_at: snapshot.observed_at,
      p_steps: snapshot.steps ?? null, p_active_kcal: snapshot.active_kcal ?? null,
      p_weight_kg: snapshot.weight_kg ?? null, p_source: snapshot.source,
    });
    if (error) {
      if (error.code === "28000") return reply(401, "Schlüssel ungültig oder widerrufen. Im OS neu verbinden.");
      if (error.code === "22023") return reply(400, "Health-Werte oder Zeitpunkt ungültig.");
      return reply(503, "Speichern nicht möglich. Verbindung und Migration 0015 im OS prüfen.");
    }
    return reply(200, data === "updated" ? "Health-Werte gespeichert." : "Dieser Stand wurde bereits übertragen oder ist älter als der gespeicherte Stand.", true);
  } catch { return reply(503, "Verbindung unterbrochen. Bitte später erneut versuchen."); }
}
