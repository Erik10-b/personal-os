import { addDays, localDateKey } from "@/lib/dateUtils";

export function getLastNDays(n: number): string[] {
  const now = new Date();
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(localDateKey(addDays(now, -i)));
  }
  return days;
}

/** Alle Tage des aktuellen Kalendermonats, vom 1. bis heute (keine zukünftigen Tage). Für Statistiken/Trends. */
export function getCurrentMonthDays(): string[] {
  const now = new Date();
  const days: string[] = [];
  for (let d = 1; d <= now.getDate(); d++) {
    days.push(localDateKey(new Date(now.getFullYear(), now.getMonth(), d)));
  }
  return days;
}

/** Alle Tage des aktuellen Kalendermonats, vom 1. bis zum letzten Tag (inkl. zukünftiger Tage). Für die Matrix-Anzeige. */
export function getCurrentMonthAllDays(): string[] {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    days.push(localDateKey(new Date(now.getFullYear(), now.getMonth(), d)));
  }
  return days;
}

/** Heutiges Datum als YYYY-MM-DD (lokale Zeit). */
export function getTodayKey(): string {
  return localDateKey();
}
