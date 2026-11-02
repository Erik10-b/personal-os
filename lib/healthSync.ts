export type HealthSnapshot = {
  date: string;
  observed_at: string;
  source: string;
  steps?: number;
  active_kcal?: number;
  weight_kg?: number;
};

/** Snapshots replace daily totals; missing values never mean zero. */
export function validateHealthSnapshot(value: unknown, now = new Date()): HealthSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("JSON-Objekt erwartet.");
  const p = { ...value } as Record<string, unknown>;
  const allowed = ["date", "observed_at", "source", "steps", "active_kcal", "weight_kg"];
  if (Object.keys(p).some(key => !allowed.includes(key))) throw new Error("Unbekanntes Feld im Health-Import.");
  if (typeof p.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) throw new Error("Datum muss yyyy-MM-dd sein.");
  const day = new Date(`${p.date}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (!Number.isFinite(+day) || day.toISOString().slice(0, 10) !== p.date || +day < today - 30 * 86400000 || +day > today + 86400000) throw new Error("Datum muss innerhalb der letzten 30 Tage liegen.");
  if (typeof p.observed_at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(p.observed_at)) throw new Error("observed_at muss ein ISO-8601-Zeitpunkt mit Zeitzone sein.");
  const observed = Date.parse(p.observed_at);
  if (!Number.isFinite(observed) || observed > +now + 300000 || observed < +now - 31 * 86400000) throw new Error("Zeitpunkt ist ungültig oder veraltet.");
  if (typeof p.source !== "string" || !p.source.trim() || p.source.length > 120) throw new Error("Quelle fehlt oder ist zu lang.");
  const ranges = { steps: [0, 200000], active_kcal: [0, 15000], weight_kg: [20, 400] } as const;
  let count = 0;
  for (const key of Object.keys(ranges) as (keyof typeof ranges)[]) {
    if (p[key] === undefined) continue;
    // Shortcuts can serialize a numeric variable as a JSON string.
    // Accept only unambiguous digit-only step totals, never lists, units or blanks.
    if (key === "steps" && typeof p[key] === "string" && /^[0-9]+$/.test(p[key].trim())) {
      p[key] = Number(p[key].trim());
    }
    const n = p[key];
    if (typeof n !== "number" || !Number.isFinite(n) || n < ranges[key][0] || n > ranges[key][1] || (key === "steps" && !Number.isInteger(n))) {
      const kind = n === null ? "leer (null)" : Array.isArray(n) ? "Liste" : typeof n === "string" ? "Text" : typeof n === "object" ? "Objekt" : typeof n === "number" ? "Zahl außerhalb des erlaubten Bereichs oder mit Nachkommastellen" : "kein Zahlenwert";
      throw new Error(`Ungültiger Wert für ${key}: ${kind}. ${key === "steps" ? "Eine einzelne ganze Zahl zwischen 0 und 200000 ohne Einheit oder Tausendertrennzeichen senden." : "Zahlen ohne Einheit im erlaubten Bereich senden."}`);
    }
    count++;
  }
  if (!count) throw new Error("Mindestens ein Health-Wert ist erforderlich.");
  return { ...p, source: p.source.trim() } as HealthSnapshot;
}

export async function readLimitedJson(request: Request, limit = 4096): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("too_large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
