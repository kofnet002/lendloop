const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type DateRange = { startDate: string; endDate: string };

export function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function todayISO(now = Date.now()): string {
  return toISODate(now);
}

export function isISODate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(ms) && toISODate(ms) === value;
}

export function addDays(date: string, days: number): string {
  return toISODate(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}
