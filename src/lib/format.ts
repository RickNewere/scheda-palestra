/** Italian formatting helpers. */

const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

export function sameDay(a: number, b: number): boolean {
  const x = new Date(a)
  const y = new Date(b)
  return x.toDateString() === y.toDateString()
}

export function dayLabel(ts: number): string {
  const now = Date.now()
  if (sameDay(ts, now)) return 'oggi'
  if (sameDay(ts, now - 86400000)) return 'ieri'
  const d = new Date(ts)
  const diff = Math.round((now - ts) / 86400000)
  if (diff > 0 && diff < 7) return DAY_NAMES[d.getDay()]
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function fullDate(ts: number): string {
  const d = new Date(ts)
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function hourMinute(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function shortDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function daysAgo(ts: number): number {
  const a = new Date(ts)
  a.setHours(0, 0, 0, 0)
  const b = new Date()
  b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function num(value: number, decimals = 1): string {
  const rounded = Math.round(value * 10 ** decimals) / 10 ** decimals
  return String(rounded).replace('.', ',')
}

export function kg(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return `${num(value, 1)} kg`
}

export function volumeLabel(value: number): string {
  if (value >= 1000) return `${num(value / 1000, 1)} t`
  return `${Math.round(value)} kg`
}

export function minutesLabel(ms: number): string {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}`
}
