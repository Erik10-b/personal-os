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

/** Alle Tage des aktuellen Kalendermonats, vom 1. bis heute (keine zukünftigen Tage). */
export function getCurrentMonthDays(): string[] {
  const now = new Date();
  const days: string[] = [];
  for (let d = 1; d <= now.getDate(); d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), d);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}
