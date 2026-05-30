// "YYYY-MM-DD" (UTC-agnostic — we ne carry only calendar dates).

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseIsoDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y as number, (m as number) - 1, d as number)
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

/** Monday of the week containing `d` (ISO 8601). */
export function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7 // 0 = Monday
  const res = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  res.setDate(res.getDate() - day)
  return res
}

export function addDays(d: Date, n: number): Date {
  const res = new Date(d)
  res.setDate(res.getDate() + n)
  return res
}

/** 7 dates from Monday to Sunday of the week containing `weekStart`. */
export function weekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Returns the 42 dates of a calendar month grid (6 weeks × 7 days, Mon-Sun). */
export function calendarGrid(monthStart: Date): Date[] {
  const firstDayOfWeek = (monthStart.getDay() + 6) % 7 // 0 = Monday
  const start = new Date(monthStart)
  start.setDate(monthStart.getDate() - firstDayOfWeek)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export const MONTH_LABELS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

export const DAY_LABELS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
