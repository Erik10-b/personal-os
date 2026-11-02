import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HealthConnection } from "@/components/health/HealthConnection";

export const dynamic = "force-dynamic";
const formatTime = (value: string) => new Date(value).toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "short", timeStyle: "short" });
const number = (value: number | null | undefined, unit = "") => value == null ? "—" : `${Number(value).toLocaleString("de-DE", { maximumFractionDigits: 1 })}${unit}`;

export default async function HealthPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const [connection, history] = await Promise.all([
    db.from("health_sync_tokens").select("created_at,last_used_at").eq("user_id", user.id).maybeSingle(),
    db.from("health_daily").select("day,steps,active_kcal,weight_kg,observed_at,received_at,source").eq("user_id", user.id).order("day", { ascending: false }).limit(14),
  ]);
  const errors = [connection.error, history.error].filter(Boolean);
  const missing = errors.some(e => ["42P01", "PGRST205"].includes(e!.code));
  const ready = errors.length === 0;
  const rows = history.data ?? [];
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const daily = rows.find(row => row.day === today);
  const weight = rows.find(row => row.weight_kg !== null);
  return <div className="health-page">
    <div className="page-head"><div><span className="health-eyebrow">Dein Alltag, verbunden</span><h1>Apple Health</h1><p>Vom iPhone direkt in dein Personal OS.</p></div><Link href="/erik/ernaehrung" className="btn secondary">Zur Ernährung</Link></div>
    {!ready && <div className="card health-notice" role="alert"><strong>{missing ? "Einmalige Datenbank-Einrichtung fehlt" : "Health-Daten gerade nicht erreichbar"}</strong><p>{missing ? "Öffne die Migration 0015, kopiere den gesamten SQL-Inhalt in den Supabase SQL Editor und führe ihn einmal aus. Danach diese Seite neu laden." : "Bitte Verbindung prüfen und die Seite neu laden. Es wurden keine Werte verändert."}</p>{missing && <a className="btn secondary" href="https://github.com/Erik10-b/personal-os/blob/codex/apple-health-shortcut/supabase/migrations/0015_health_shortcut.sql" target="_blank" rel="noreferrer">Migration 0015 öffnen</a>}</div>}
    <section className="card health-status"><span className={`health-dot${connection.data ? " connected" : ""}`} aria-hidden="true" /><div><strong>{connection.data ? connection.data.last_used_at ? "Verbindung aktiv" : "Bereit für den ersten Import" : "Noch nicht verbunden"}</strong><p>{connection.data?.last_used_at ? `Letzter Kontakt: ${formatTime(connection.data.last_used_at)} Uhr` : "Einmal auf deinem iPhone einrichten, danach per Kurzbefehl übertragen."}</p></div></section>
    <div className="health-metrics">
      <article className="card"><span>Schritte heute</span><strong>{number(daily?.steps)}</strong><small>{daily?.steps == null ? "Noch nicht übertragen" : "Tagesstand der gewählten Quelle"}</small></article>
      <article className="card"><span>Aktivitätsenergie heute</span><strong>{number(daily?.active_kcal, " kcal")}</strong><small>Ohne Ruheenergie</small></article>
      <article className="card"><span>Letztes importiertes Gewicht</span><strong>{number(weight?.weight_kg, " kg")}</strong><small>{weight ? new Date(`${weight.day}T12:00:00Z`).toLocaleDateString("de-DE") : "Noch keine Messung übertragen"}</small></article>
    </div>
    <p className="health-context">{daily ? `Tagesstand zuletzt aktualisiert: ${formatTime(daily.observed_at)} Uhr. Einzelne Werte können aus einem früheren Import desselben Tages stammen. ` : "Für heute liegt noch kein Import vor. "}Dein Kalorienziel bleibt unverändert. Training kann bereits in der Aktivitätsenergie enthalten sein und wird nicht zusätzlich angerechnet. Diese Verbindung sendet keine Daten an eine KI.</p>
    <HealthConnection connected={!!connection.data} ready={ready} />
    <section className="card"><h2>Deine letzten Übertragungen</h2><p>Bis zu 14 Tage mit importierten Daten · Tagesgrenzen für diese Ansicht: Europe/Berlin.</p>
      {rows.length === 0 ? <div className="health-empty">Nach dem ersten erfolgreichen Lauf erscheinen deine echten Werte hier.</div> : <div className="health-table-scroll"><table><thead><tr><th>Tag</th><th>Schritte</th><th>Aktiv kcal</th><th>Gewicht</th><th>Stand / Quelle</th></tr></thead><tbody>{rows.map(row => <tr key={row.day}><td>{new Date(`${row.day}T12:00:00Z`).toLocaleDateString("de-DE")}</td><td>{number(row.steps)}</td><td>{number(row.active_kcal)}</td><td>{number(row.weight_kg, " kg")}</td><td>{formatTime(row.observed_at)}<small>{row.source}</small></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
