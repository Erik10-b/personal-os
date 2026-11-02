"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeHealthConnection } from "@/lib/actions/health";

const endpoint = "https://personal-os-eight-chi.vercel.app/api/health/sync";

export function HealthConnection({ connected, ready }: { connected: boolean; ready: boolean }) {
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function change(revoke: boolean) {
    if (connected && !window.confirm(revoke ? "Verbindung trennen? Dein Kurzbefehl kann danach nichts mehr übertragen. Importierte Werte bleiben erhalten." : "Neuen Schlüssel erzeugen? Den bisherigen Schlüssel musst du anschließend im Kurzbefehl ersetzen.")) return;
    setMessage("");
    startTransition(async () => {
      try {
        const result = await changeHealthConnection(revoke);
        if (result.error) { setMessage(result.error); return; }
        setToken(result.token ?? null);
        setMessage(revoke ? "Verbindung getrennt." : "Schlüssel erstellt. Jetzt einmalig in deinen Kurzbefehl kopieren.");
        router.refresh();
      } catch { setMessage("Aktion fehlgeschlagen. Bitte Verbindung prüfen und erneut versuchen."); }
    });
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setMessage("Kopiert."); }
    catch { setMessage("Kopieren nicht möglich. Text gedrückt halten und manuell kopieren."); }
  }
  return <section className="card health-connection">
    <div><span className="health-eyebrow">Einmal verbinden</span><h2>Dein iPhone liefert die Werte</h2><p>Der Schlüssel darf nur Schritte, Aktivitätskalorien und Gewicht an dein Konto senden. Er kann keine Daten lesen.</p></div>
    <div className="health-actions">
      <button className="btn primary" disabled={!ready || pending} onClick={() => change(false)}>{pending ? "Bitte warten …" : connected ? "Schlüssel erneuern" : "Verbindungsschlüssel erstellen"}</button>
      {connected && <button className="btn secondary" disabled={pending} onClick={() => change(true)}>Verbindung trennen</button>}
      <button className="btn ghost" onClick={() => router.refresh()}>Status aktualisieren</button>
    </div>
    {token && <div className="health-secret">
      <strong>Nur jetzt sichtbar</strong><p>In den Kurzbefehl kopieren und anschließend hier ausblenden. Teile keinen Kurzbefehl, der diesen Schlüssel enthält.</p>
      <label htmlFor="health-token">Authorization-Header</label>
      <input id="health-token" className="input" readOnly value={`Bearer ${token}`} spellCheck={false} autoComplete="off" />
      <div className="health-actions"><button className="btn primary" onClick={() => copy(`Bearer ${token}`)}>Header kopieren</button><button className="btn ghost" onClick={() => setToken(null)}>Schlüssel ausblenden</button></div>
    </div>}
    <p role="status" aria-live="polite">{message}</p>
    <div className="health-endpoint"><code>{endpoint}</code><button className="btn secondary" onClick={() => copy(endpoint)}>Adresse kopieren</button></div>
    <details className="health-guide" open={!connected}>
      <summary>iPhone-Kurzbefehl einrichten</summary>
      <p>Einmal in Apples App „Kurzbefehle“ anlegen. Beginne mit Schritten; Kalorien und Gewicht sind optional. Aktionsnamen können je nach iOS-Version leicht abweichen.</p>
      <ol>
        <li><strong>Neuer Kurzbefehl → „Personal OS – Health“.</strong> Füge „Aktuelles Datum“ hinzu. Verwende denselben Zeitpunkt für zwei Aktionen „Datum formatieren“: einmal benutzerdefiniert <code>yyyy-MM-dd</code> (Variable <code>Tag</code>), einmal ISO 8601 mit Uhrzeit und Zeitzone (Variable <code>Zeitpunkt</code>).</li>
        <li><strong>„Health-Daten suchen“:</strong> Typ „Schritte“, Startdatum „ist heute“. Begrenzung ausschalten. Wähle als Quelle genau <strong>ein</strong> Gerät, z. B. dein iPhone. iPhone und Watch zusammen können dieselben Schritte mehrfach enthalten. Bei einem späteren Gerätewechsel die Quelle anpassen.</li>
        <li><strong>Ergebnis prüfen.</strong> Mit „Wenn“ prüfen, ob die gefundenen Daten einen Wert haben. Falls leer: Hinweis „Keine Schritte gefunden – Health-Freigabe prüfen“ anzeigen und „Diesen Kurzbefehl stoppen“. Fehlende Freigaben nicht als null Schritte übertragen.</li>
        <li><strong>Werte addieren:</strong> Mit „Details von Health-Daten abrufen“ den „Wert“ aller gefundenen Einträge holen. „Statistik berechnen“ → „Summe“, danach auf ganze Zahlen runden. Ergebnis als Variable <code>Schritte</code> setzen.</li>
        <li><strong>„Inhalte von URL abrufen“</strong> hinzufügen. Die Adresse oben einfügen, Methode <code>POST</code>. Unter Header: Schlüssel <code>Authorization</code>, Wert aus „Header kopieren“ (einschließlich <code>Bearer </code>). Anfragetext auf <code>JSON</code> stellen und die Felder aus der Tabelle eintragen. Farbige Variablen einsetzen, nicht ihre Namen als Text tippen.</li>
      </ol>
      <div className="health-table-scroll"><table><thead><tr><th>Feld</th><th>Typ</th><th>Wert</th></tr></thead><tbody>
        <tr><td><code>date</code></td><td>Text</td><td>Variable Tag</td></tr>
        <tr><td><code>observed_at</code></td><td>Text</td><td>Variable Zeitpunkt</td></tr>
        <tr><td><code>source</code></td><td>Text</td><td>Apple Health – iPhone</td></tr>
        <tr><td><code>steps</code></td><td>Zahl</td><td>Variable Schritte</td></tr>
      </tbody></table></div>
      <p>Danach „Wörterbuchwert abrufen“ → Schlüssel <code>message</code> aus der URL-Antwort, dann „Ergebnis anzeigen“. So siehst du auch einen ungültigen Schlüssel oder einen Speicherfehler.</p>
      <p><strong>Erster Test:</strong> iPhone entsperren, Kurzbefehl starten, Zugriff auf Schritte erlauben. Bei Erfolg steht „Health-Werte gespeichert“. Hier „Status aktualisieren“ antippen. Vergleiche den Wert mit der gewählten Quelle in Health; Apples Gesamtanzeige kann mehrere Geräte bereinigt zusammenführen und deshalb abweichen.</p>
      <details><summary>Aktivitätskalorien und Gewicht ergänzen</summary>
        <p>Vor der URL-Aktion zusätzlich Health-Daten suchen. Für Aktivitätsenergie: heute, genau eine Quelle, alle Werte summieren, Einheit ausdrücklich <strong>kcal</strong>. Für Gewicht: heute, neueste Messung zuerst, Begrenzung 1, Einheit ausdrücklich <strong>kg</strong>. Falls Health eine andere Einheit liefert, vor dem Versand umrechnen.</p>
        <p>Baue den Anfragetext dann als „Wörterbuch“ mit den vier Basisfeldern. Nur bei vorhandenen Werten per „Wörterbuchwert festlegen“ ergänzen: <code>active_kcal</code> als Zahl und/oder <code>weight_kg</code> als Zahl. Das jeweils aktualisierte Wörterbuch weiterverwenden. Mit „Text“ in JSON umwandeln und als Datei-Anfragetext der URL-Aktion übergeben; zusätzlich Header <code>Content-Type: application/json</code>. Keine leeren Zeichenketten und keine Einheiten mitsenden.</p>
        <p>Alternativ erst die Schritte-Verbindung testen und Kalorien/Gewicht später ergänzen. Gewicht bleibt im Health-Bereich; manuelle Gewichtseinträge werden nicht überschrieben. Einheiten oder Kalorien werden nicht als zusätzliches Training angelegt.</p>
      </details>
      <details><summary>Später automatisch übertragen</summary>
        <p>In „Kurzbefehle“ → „Automation“ eine persönliche Automation anlegen, z. B. beim Öffnen deiner Trainings-App oder zu einer Tageszeit. Aktion „Kurzbefehl ausführen“ → „Personal OS – Health“, wenn angeboten „Sofort ausführen“. Erst manuell testen. Bei gesperrtem iPhone kann Health-Zugriff ausbleiben; der Zeitstempel hier zeigt, ob eine Übertragung wirklich ankam.</p>
        <p>Übertragen wird der heutige Zwischenstand. Ein Lauf am Abend enthält keine Schritte, die danach noch dazukommen. Für einen abgeschlossenen Vortag einen zweiten Durchlauf mit dem Zeitfilter „gestern“ und dem entsprechend formatierten Vortagsdatum erstellen; der Übertragungszeitpunkt bleibt aktuell.</p>
      </details>
    </details>
  </section>;
}
