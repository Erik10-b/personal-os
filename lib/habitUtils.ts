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
