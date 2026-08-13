/** Aggregations over the training history. */
import type { Exercise, Session, SetLog } from '../types'

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function setVolume(s: SetLog): number {
  if (!s.done) return 0
  const w = s.weight ?? 0
  const r = s.reps ?? 0
  return w * r
}

export function sessionVolume(session: Session): number {
  let total = 0
  for (const log of Object.values(session.logs)) {
    for (const s of log.sets) total += setVolume(s)
  }
  return total
}

export function sessionSetsDone(session: Session): number {
  let n = 0
  for (const log of Object.values(session.logs)) n += log.sets.filter((s) => s.done).length
  return n
}

export function sessionDuration(session: Session): number {
  if (!session.endedAt) return 0
  return Math.max(0, session.endedAt - session.startedAt)
}

/** Epley formula, only meaningful for reps between 1 and 12. */
export function estimate1RM(weight: number, reps: number): number {
  if (!weight || !reps) return 0
  return weight * (1 + reps / 30)
}

export interface ExercisePoint {
  date: number
  sessionId: string
  sets: SetLog[]
  topWeight: number
  volume: number
  best1RM: number
  totalReps: number
}

export function exerciseHistory(sessions: Session[], exerciseName: string): ExercisePoint[] {
  const target = normalizeName(exerciseName)
  const points: ExercisePoint[] = []
  for (const session of sessions) {
    for (const [exId, log] of Object.entries(session.logs)) {
      const name = session.names[exId]
      if (!name || normalizeName(name) !== target) continue
      const done = log.sets.filter((s) => s.done)
      if (!done.length) continue
      const topWeight = Math.max(0, ...done.map((s) => s.weight ?? 0))
      const volume = done.reduce((acc, s) => acc + setVolume(s), 0)
      const best1RM = Math.max(0, ...done.map((s) => estimate1RM(s.weight ?? 0, s.reps ?? 0)))
      const totalReps = done.reduce((acc, s) => acc + (s.reps ?? 0), 0)
      points.push({
        date: session.startedAt,
        sessionId: session.id,
        sets: done,
        topWeight,
        volume,
        best1RM,
        totalReps,
      })
    }
  }
  return points.sort((a, b) => a.date - b.date)
}

export function lastEntryFor(sessions: Session[], exerciseName: string): ExercisePoint | null {
  const h = exerciseHistory(sessions, exerciseName)
  return h.length ? h[h.length - 1] : null
}

export interface PersonalRecord {
  weight: number
  reps: number
  date: number
  e1rm: number
  volume: number
}

export function personalRecord(sessions: Session[], exerciseName: string): PersonalRecord | null {
  const history = exerciseHistory(sessions, exerciseName)
  let best: PersonalRecord | null = null
  for (const point of history) {
    for (const s of point.sets) {
      const w = s.weight ?? 0
      const r = s.reps ?? 0
      const e = estimate1RM(w, r)
      if (!best || e > best.e1rm || (e === best.e1rm && w > best.weight)) {
        best = { weight: w, reps: r, date: point.date, e1rm: e, volume: point.volume }
      }
    }
  }
  return best && best.weight > 0 ? best : null
}

/** Suggested load for the next session: the top set of the last time. */
export function suggestedSets(
  sessions: Session[],
  exercise: Exercise,
): SetLog[] {
  const last = lastEntryFor(sessions, exercise.name)
  const previous = last ? last.sets : []
  const count = Math.max(1, exercise.sets ?? previous.length ?? 3)
  const out: SetLog[] = []
  for (let i = 0; i < count; i++) {
    const prev = previous[i] ?? previous[previous.length - 1]
    out.push({
      weight: prev?.weight ?? null,
      reps: exercise.kind === 'time' ? null : exercise.reps ?? prev?.reps ?? null,
      seconds: exercise.kind === 'time' || exercise.kind === 'cardio' ? exercise.durationSec : null,
      done: false,
    })
  }
  return out
}

export function startOfWeek(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d.getTime()
}

export interface WeekStat {
  weekStart: number
  sessions: number
  volume: number
  sets: number
  minutes: number
}

export function weeklyStats(sessions: Session[], weeks = 8): WeekStat[] {
  const now = startOfWeek(Date.now())
  const out: WeekStat[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = now - i * 7 * 86400000
    const weekEnd = weekStart + 7 * 86400000
    const inWeek = sessions.filter((s) => s.startedAt >= weekStart && s.startedAt < weekEnd && s.done)
    out.push({
      weekStart,
      sessions: inWeek.length,
      volume: inWeek.reduce((a, s) => a + sessionVolume(s), 0),
      sets: inWeek.reduce((a, s) => a + sessionSetsDone(s), 0),
      minutes: Math.round(inWeek.reduce((a, s) => a + sessionDuration(s), 0) / 60000),
    })
  }
  return out
}

export function muscleBreakdown(sessions: Session[], exercisesByName: Map<string, Exercise>): { muscle: string; sets: number }[] {
  const counts = new Map<string, number>()
  for (const session of sessions) {
    for (const [exId, log] of Object.entries(session.logs)) {
      const name = session.names[exId]
      const ex = name ? exercisesByName.get(normalizeName(name)) : undefined
      const done = log.sets.filter((s) => s.done).length
      if (!ex || !done) continue
      for (const m of ex.muscles) counts.set(m, (counts.get(m) || 0) + done)
    }
  }
  return [...counts.entries()]
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => b.sets - a.sets)
}

export function streak(sessions: Session[]): number {
  const days = new Set(
    sessions.filter((s) => s.done).map((s) => new Date(s.startedAt).toDateString()),
  )
  let count = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  // A streak keeps going as long as there is a session every 3 days.
  for (let i = 0; i < 365; i++) {
    if (days.has(cursor.toDateString())) count++
    else if (count > 0 && i > 0) {
      const gapOk = [1, 2].some((d) => {
        const probe = new Date(cursor)
        probe.setDate(probe.getDate() - d)
        return days.has(probe.toDateString())
      })
      if (!gapOk) break
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}
