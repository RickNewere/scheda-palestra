/** Parsing of the "3x12", "10 min", "3x30secx30sec" notation used in the sheets. */
import type { ExerciseKind } from '../types'

export interface ParsedScheme {
  sets: number | null
  reps: number | null
  durationSec: number | null
  perSide: boolean
  kind: ExerciseKind
}

const NUM = /(\d+(?:[.,]\d+)?)/

/** Seconds from "3'", "30''", "45 sec", "10 min". Null when the text has no time. */
export function parseDuration(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  const m = s.match(new RegExp(`${NUM.source}\\s*(''|"|’’|min\\w*|m\\b|sec\\w*|s\\b|'|’)?`))
  if (!m) return null
  const value = parseFloat(m[1].replace(',', '.'))
  const unit = (m[2] || '').trim()
  if (!unit) return null
  if (unit === "''" || unit === '"' || unit === '’’' || unit.startsWith('sec') || unit === 's') {
    return Math.round(value)
  }
  return Math.round(value * 60)
}

export function parseScheme(raw: string): ParsedScheme {
  const s = (raw || '').trim().toLowerCase()
  const empty: ParsedScheme = { sets: null, reps: null, durationSec: null, perSide: false, kind: 'reps' }
  if (!s) return empty

  const tokens = s.split(/\s*[x×*]\s*/).filter((t) => t.length > 0)
  const isTime = (t: string) => /(sec|min|''|"|'|’)/.test(t)
  const toInt = (t: string) => {
    const m = t.match(/\d+/)
    return m ? parseInt(m[0], 10) : null
  }

  if (tokens.length === 1) {
    const t = tokens[0]
    if (isTime(t)) {
      return { sets: 1, reps: null, durationSec: parseDuration(t), perSide: false, kind: 'time' }
    }
    const n = toInt(t)
    return { sets: 1, reps: n, durationSec: null, perSide: false, kind: 'reps' }
  }

  const sets = toInt(tokens[0])
  const second = tokens[1]
  const perSide = tokens.length > 2
  if (isTime(second)) {
    return { sets, reps: null, durationSec: parseDuration(second), perSide, kind: 'time' }
  }
  return { sets, reps: toInt(second), durationSec: null, perSide, kind: 'reps' }
}

export function formatScheme(p: ParsedScheme): string {
  if (p.kind === 'time' || p.durationSec) {
    const time = p.durationSec ? formatShortDuration(p.durationSec) : '?'
    return `${p.sets ?? 1}x${time}${p.perSide ? ' per lato' : ''}`
  }
  return `${p.sets ?? 1}x${p.reps ?? '?'}${p.perSide ? ' per lato' : ''}`
}

export function formatShortDuration(sec: number): string {
  if (sec >= 60 && sec % 60 === 0) return `${sec / 60} min`
  if (sec >= 60) return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
  return `${sec} sec`
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
