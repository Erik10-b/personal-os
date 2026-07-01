export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

/** Alle Tage des aktuellen Kalendermonats, vom 1. bis heute (keine zukünftigen Tage). Für Statistiken/Trends. */
export function getCurrentMonthDays(): string[] {
  const now = new Date();
  const days: string[] = [];
  for (let d = 1; d <= now.getDate(); d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), d);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

/** Alle Tage des aktuellen Kalendermonats, vom 1. bis zum letzten Tag (inkl. zukünftiger Tage). Für die Matrix-Anzeige. */
export function getCurrentMonthAllDays(): string[] {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), d);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

/** Heutiges Datum als YYYY-MM-DD (lokale Zeit). */
export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
