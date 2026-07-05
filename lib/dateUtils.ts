/**
 * Tages-Key (YYYY-MM-DD) aus LOKALER Zeit — niemals toISOString() dafür verwenden:
 * das liefert das UTC-Datum und ist in Deutschland zwischen 0 und 2 Uhr der Vortag.
 */
export function localDateKey(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Neues Date um n Tage verschoben (lokale Zeit). */
export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}
