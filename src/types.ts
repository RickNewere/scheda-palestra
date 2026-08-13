/** Domain model shared across the app. */

export type ExerciseKind = 'reps' | 'time' | 'cardio'

export interface Exercise {
  id: string
  /** Column index in the source sheet, kept so images and notes can be re-matched. */
  col: number
  order: number
  name: string
  /** Raw scheme of the active variant, e.g. "3x12". */
  scheme: string
  /** All variants found in the sheet, keyed by the label in the first column. */
  schemes: Record<string, string>
  sets: number | null
  reps: number | null
  /** Seconds per set for timed work. */
  durationSec: number | null
  /** True when the scheme repeats the load per side, e.g. "3x12x12". */
  perSide: boolean
  kind: ExerciseKind
  note: string | null
  /** Key of a picture extracted from the workbook. */
  imageId: string | null
  /** Animation pattern id, resolved from the name. */
  pattern: string
  muscles: string[]
  /** Exercises added by hand are kept when a scheda is re-imported. */
  custom?: boolean
}

export interface Day {
  id: string
  index: number
  label: string
  title: string
  restSeconds: number
  exercises: Exercise[]
}

export interface Scheda {
  id: string
  name: string
  sourceFile: string
  importedAt: number
  /** Active variant label, one of the keys of Exercise.schemes. */
  variant: string
  variants: string[]
  days: Day[]
}

export interface SetLog {
  weight: number | null
  reps: number | null
  /** Seconds actually performed, for timed work. */
  seconds: number | null
  done: boolean
}

export interface ExerciseLog {
  sets: SetLog[]
  note?: string
  skipped?: boolean
}

export interface Session {
  id: string
  schedaId: string
  schedaName: string
  dayId: string
  dayTitle: string
  dayLabel: string
  startedAt: number
  endedAt: number | null
  /** Last time something was written into the session. */
  updatedAt?: number
  logs: Record<string, ExerciseLog>
  /** Snapshot of exercise names, so history survives a re-import. */
  names: Record<string, string>
  done: boolean
}

export interface Settings {
  activeSchedaId: string | null
  sound: boolean
  vibration: boolean
  keepAwake: boolean
  autoRest: boolean
  weightStep: number
  seeded: boolean
}

export interface StoredImage {
  id: string
  mime: string
  data: ArrayBuffer
}
