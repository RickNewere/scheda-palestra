/** Global state: schede, sessions, settings and the picture cache. */
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  DEFAULT_SETTINGS,
  STORE_IMAGES,
  STORE_SCHEDE,
  STORE_SESSIONS,
  loadImages,
  loadSchede,
  loadSessions,
  loadSettings,
  put,
  putMany,
  remove,
  saveSettings,
  wipeAll,
} from './db'
import { applyVariant, parseWorkbookToScheda, uid } from './parser'
import { parseScheme } from './scheme'
import { metaFor } from './exerciseMeta'
import { suggestedSets } from './stats'
import type { Day, Exercise, Scheda, Session, Settings, StoredImage } from '../types'

interface ImportOutcome {
  scheda: Scheda
  warnings: string[]
}

interface AppApi {
  ready: boolean
  schede: Scheda[]
  sessions: Session[]
  settings: Settings
  activeScheda: Scheda | null
  activeSession: Session | null
  imageUrl: (id: string | null) => string | null
  importFile: (file: File) => Promise<ImportOutcome>
  setActiveScheda: (id: string) => Promise<void>
  renameScheda: (id: string, name: string) => Promise<void>
  deleteScheda: (id: string) => Promise<void>
  setVariant: (id: string, variant: string) => Promise<void>
  updateExercise: (schedaId: string, dayId: string, exerciseId: string, patch: Partial<Exercise>) => Promise<void>
  moveExercise: (schedaId: string, dayId: string, exerciseId: string, delta: number) => Promise<void>
  addExercise: (schedaId: string, dayId: string, name: string, scheme: string) => Promise<void>
  deleteExercise: (schedaId: string, dayId: string, exerciseId: string) => Promise<void>
  updateDay: (schedaId: string, dayId: string, patch: Partial<Day>) => Promise<void>
  startSession: (scheda: Scheda, day: Day) => Promise<Session>
  saveSession: (session: Session) => Promise<void>
  finishSession: (session: Session) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  exportBackup: () => Promise<string>
  importBackup: (json: string) => Promise<void>
  resetAll: () => Promise<void>
}

const Ctx = createContext<AppApi | null>(null)

export function useApp(): AppApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp fuori dal provider')
  return ctx
}

async function persistImages(images: { id: string; mime: string; data: Uint8Array }[]): Promise<StoredImage[]> {
  const stored: StoredImage[] = images.map((i) => ({
    id: i.id,
    mime: i.mime,
    data: i.data.buffer.slice(i.data.byteOffset, i.data.byteOffset + i.data.byteLength) as ArrayBuffer,
  }))
  await putMany(STORE_IMAGES, stored)
  return stored
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [schede, setSchede] = useState<Scheda[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const urls = useRef(new Map<string, string>())

  const registerImages = (stored: StoredImage[]) => {
    for (const img of stored) {
      if (urls.current.has(img.id)) continue
      urls.current.set(img.id, URL.createObjectURL(new Blob([img.data], { type: img.mime })))
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [storedSchede, storedSessions, storedImages, storedSettings] = await Promise.all([
        loadSchede(),
        loadSessions(),
        loadImages(),
        loadSettings(),
      ])
      if (cancelled) return
      registerImages(storedImages)
      let nextSchede = storedSchede
      let nextSettings = storedSettings

      // First launch: load the scheda shipped with the app.
      if (!nextSchede.length && !storedSettings.seeded) {
        try {
          const url = `${import.meta.env.BASE_URL}scheda-2.xlsx`
          const res = await fetch(url)
          if (res.ok) {
            const buffer = await res.arrayBuffer()
            const parsed = parseWorkbookToScheda(buffer, 'Scheda 2')
            const stored = await persistImages(parsed.images)
            registerImages(stored)
            await put(STORE_SCHEDE, parsed.scheda)
            nextSchede = [parsed.scheda]
            nextSettings = { ...nextSettings, activeSchedaId: parsed.scheda.id, seeded: true }
            await saveSettings(nextSettings)
          }
        } catch {
          /* no bundled scheda, the user will import one */
        }
      }

      if (!nextSettings.activeSchedaId && nextSchede.length) {
        nextSettings = { ...nextSettings, activeSchedaId: nextSchede[0].id }
        await saveSettings(nextSettings)
      }

      setSchede(nextSchede)
      setSessions(storedSessions.sort((a, b) => b.startedAt - a.startedAt))
      setSettings(nextSettings)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeScheda = useMemo(
    () => schede.find((s) => s.id === settings.activeSchedaId) || schede[0] || null,
    [schede, settings.activeSchedaId],
  )

  const activeSession = useMemo(() => sessions.find((s) => !s.done) || null, [sessions])

  const saveScheda = async (scheda: Scheda) => {
    await put(STORE_SCHEDE, scheda)
    setSchede((prev) => prev.map((s) => (s.id === scheda.id ? scheda : s)))
  }

  const patchScheda = async (id: string, fn: (s: Scheda) => Scheda) => {
    const current = schede.find((s) => s.id === id)
    if (!current) return
    await saveScheda(fn(current))
  }

  const patchDay = async (schedaId: string, dayId: string, fn: (d: Day) => Day) =>
    patchScheda(schedaId, (s) => ({ ...s, days: s.days.map((d) => (d.id === dayId ? fn(d) : d)) }))

  const api: AppApi = {
    ready,
    schede,
    sessions,
    settings,
    activeScheda,
    activeSession,

    imageUrl: (id) => (id ? urls.current.get(id) || null : null),

    async importFile(file) {
      const buffer = await file.arrayBuffer()
      const parsed = parseWorkbookToScheda(buffer, file.name)
      const stored = await persistImages(parsed.images)
      registerImages(stored)
      await put(STORE_SCHEDE, parsed.scheda)
      setSchede((prev) => [...prev, parsed.scheda])
      const next = { ...settings, activeSchedaId: parsed.scheda.id, seeded: true }
      await saveSettings(next)
      setSettings(next)
      return { scheda: parsed.scheda, warnings: parsed.warnings }
    },

    async setActiveScheda(id) {
      const next = { ...settings, activeSchedaId: id }
      await saveSettings(next)
      setSettings(next)
    },

    async renameScheda(id, name) {
      await patchScheda(id, (s) => ({ ...s, name }))
    },

    async deleteScheda(id) {
      await remove(STORE_SCHEDE, id)
      const rest = schede.filter((s) => s.id !== id)
      setSchede(rest)
      if (settings.activeSchedaId === id) {
        const next = { ...settings, activeSchedaId: rest[0]?.id ?? null }
        await saveSettings(next)
        setSettings(next)
      }
    },

    async setVariant(id, variant) {
      await patchScheda(id, (s) => applyVariant(s, variant))
    },

    async updateExercise(schedaId, dayId, exerciseId, patch) {
      await patchDay(schedaId, dayId, (day) => ({
        ...day,
        exercises: day.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex
          const merged = { ...ex, ...patch }
          if (patch.scheme !== undefined) {
            const parsed = parseScheme(patch.scheme)
            merged.sets = parsed.sets
            merged.reps = parsed.reps
            merged.durationSec = parsed.durationSec
            merged.perSide = parsed.perSide
            merged.kind = merged.kind === 'cardio' ? 'cardio' : parsed.kind
            merged.schemes = { ...ex.schemes, [schede.find((s) => s.id === schedaId)?.variant || 'Default']: patch.scheme }
          }
          if (patch.name !== undefined && patch.pattern === undefined) {
            const meta = metaFor(patch.name)
            merged.pattern = meta.pattern
            merged.muscles = meta.muscles
          }
          return merged
        }),
      }))
    },

    async moveExercise(schedaId, dayId, exerciseId, delta) {
      await patchDay(schedaId, dayId, (day) => {
        const list = [...day.exercises]
        const i = list.findIndex((e) => e.id === exerciseId)
        const j = i + delta
        if (i < 0 || j < 0 || j >= list.length) return day
        ;[list[i], list[j]] = [list[j], list[i]]
        return { ...day, exercises: list.map((e, idx) => ({ ...e, order: idx })) }
      })
    },

    async addExercise(schedaId, dayId, name, scheme) {
      const parsed = parseScheme(scheme)
      const meta = metaFor(name)
      await patchDay(schedaId, dayId, (day) => {
        const variant = schede.find((s) => s.id === schedaId)?.variant || 'Default'
        const exercise: Exercise = {
          id: uid('ex'),
          col: 100 + day.exercises.length,
          order: day.exercises.length,
          name,
          scheme,
          schemes: { [variant]: scheme },
          sets: parsed.sets,
          reps: parsed.reps,
          durationSec: parsed.durationSec,
          perSide: parsed.perSide,
          kind: meta.cardio ? 'cardio' : parsed.kind,
          note: null,
          imageId: null,
          pattern: meta.pattern,
          muscles: meta.muscles,
          custom: true,
        }
        return { ...day, exercises: [...day.exercises, exercise] }
      })
    },

    async deleteExercise(schedaId, dayId, exerciseId) {
      await patchDay(schedaId, dayId, (day) => ({
        ...day,
        exercises: day.exercises.filter((e) => e.id !== exerciseId).map((e, idx) => ({ ...e, order: idx })),
      }))
    },

    async updateDay(schedaId, dayId, patch) {
      await patchDay(schedaId, dayId, (day) => ({ ...day, ...patch }))
    },

    async startSession(scheda, day) {
      // Only one session can be open at a time.
      for (const open of sessions.filter((s) => !s.done)) await remove(STORE_SESSIONS, open.id)
      const session: Session = {
        id: uid('ses'),
        schedaId: scheda.id,
        schedaName: scheda.name,
        dayId: day.id,
        dayTitle: day.title,
        dayLabel: day.label,
        startedAt: Date.now(),
        endedAt: null,
        logs: {},
        names: {},
        done: false,
      }
      for (const ex of day.exercises) {
        session.logs[ex.id] = { sets: suggestedSets(sessions, ex) }
        session.names[ex.id] = ex.name
      }
      await put(STORE_SESSIONS, session)
      setSessions((prev) => [session, ...prev.filter((s) => s.done)])
      return session
    },

    async saveSession(session) {
      await put(STORE_SESSIONS, session)
      setSessions((prev) => {
        const rest = prev.filter((s) => s.id !== session.id)
        return [session, ...rest].sort((a, b) => b.startedAt - a.startedAt)
      })
    },

    async finishSession(session) {
      const done: Session = { ...session, done: true, endedAt: Date.now() }
      await api.saveSession(done)
    },

    async deleteSession(id) {
      await remove(STORE_SESSIONS, id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    },

    async updateSettings(patch) {
      const next = { ...settings, ...patch }
      await saveSettings(next)
      setSettings(next)
    },

    async exportBackup() {
      const images = await loadImages()
      const payload = {
        app: 'scheda-palestra',
        version: 1,
        exportedAt: Date.now(),
        schede,
        sessions,
        settings,
        images: images.map((img) => ({
          id: img.id,
          mime: img.mime,
          data: bytesToBase64(new Uint8Array(img.data)),
        })),
      }
      return JSON.stringify(payload)
    },

    async importBackup(json) {
      const data = JSON.parse(json) as {
        schede?: Scheda[]
        sessions?: Session[]
        settings?: Settings
        images?: { id: string; mime: string; data: string }[]
      }
      if (!data.schede) throw new Error('Backup non valido')
      const images: StoredImage[] = (data.images || []).map((i) => ({
        id: i.id,
        mime: i.mime,
        data: base64ToBytes(i.data).buffer as ArrayBuffer,
      }))
      await putMany(STORE_IMAGES, images)
      registerImages(images)
      await putMany(STORE_SCHEDE, data.schede)
      if (data.sessions?.length) await putMany(STORE_SESSIONS, data.sessions)
      const nextSettings = { ...DEFAULT_SETTINGS, ...(data.settings || settings), seeded: true }
      await saveSettings(nextSettings)
      setSchede(data.schede)
      setSessions((data.sessions || []).sort((a, b) => b.startedAt - a.startedAt))
      setSettings(nextSettings)
    },

    async resetAll() {
      await wipeAll()
      for (const url of urls.current.values()) URL.revokeObjectURL(url)
      urls.current.clear()
      setSchede([])
      setSessions([])
      setSettings({ ...DEFAULT_SETTINGS, seeded: true })
      await saveSettings({ ...DEFAULT_SETTINGS, seeded: true })
    },
  }

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}
