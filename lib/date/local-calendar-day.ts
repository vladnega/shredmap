/** YYYY-MM-DD in the browser's local calendar (for ride plans). */
export function formatLocalCalendarDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Lexicographic compare for ISO `YYYY-MM-DD` strings (valid dates only). */
export function compareIsoDateStrings(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
