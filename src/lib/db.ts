/** IndexedDB storage. Everything stays on the device, no backend involved. */
import type { Scheda, Session, Settings, StoredImage } from '../types'

const DB_NAME = 'scheda-palestra'
const DB_VERSION = 1

export const STORE_SCHEDE = 'schede'
export const STORE_SESSIONS = 'sessions'
export const STORE_IMAGES = 'images'
export const STORE_KV = 'kv'

export const DEFAULT_SETTINGS: Settings = {
  activeSchedaId: null,
  sound: true,
  vibration: true,
  keepAwake: true,
  autoRest: true,
  weightStep: 2.5,
  seeded: false,
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_SCHEDE)) db.createObjectStore(STORE_SCHEDE, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const s = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' })
        s.createIndex('startedAt', 'startedAt')
        s.createIndex('schedaId', 'schedaId')
      }
      if (!db.objectStoreNames.contains(STORE_IMAGES)) db.createObjectStore(STORE_IMAGES, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV, { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode)
        const req = run(t.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

export function getAll<T>(store: string): Promise<T[]> {
  return tx<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>)
}

export function put<T>(store: string, value: T): Promise<T> {
  return tx(store, 'readwrite', (s) => s.put(value as unknown as object) as IDBRequest<IDBValidKey>).then(() => value)
}

export function putMany<T>(store: string, values: T[]): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(store, 'readwrite')
        const os = t.objectStore(store)
        for (const v of values) os.put(v as unknown as object)
        t.oncomplete = () => resolve()
        t.onerror = () => reject(t.error)
      }),
  )
}

export function remove(store: string, key: string): Promise<void> {
  return tx(store, 'readwrite', (s) => s.delete(key) as IDBRequest<undefined>).then(() => undefined)
}

export function clearStore(store: string): Promise<void> {
  return tx(store, 'readwrite', (s) => s.clear() as IDBRequest<undefined>).then(() => undefined)
}

export async function loadSettings(): Promise<Settings> {
  const rows = await getAll<{ key: string; value: Settings }>(STORE_KV)
  const found = rows.find((r) => r.key === 'settings')
  return { ...DEFAULT_SETTINGS, ...(found?.value || {}) }
}

export function saveSettings(value: Settings): Promise<unknown> {
  return put(STORE_KV, { key: 'settings', value })
}

export const loadSchede = () => getAll<Scheda>(STORE_SCHEDE)
export const loadSessions = () => getAll<Session>(STORE_SESSIONS)
export const loadImages = () => getAll<StoredImage>(STORE_IMAGES)

export async function wipeAll(): Promise<void> {
  await Promise.all([
    clearStore(STORE_SCHEDE),
    clearStore(STORE_SESSIONS),
    clearStore(STORE_IMAGES),
    clearStore(STORE_KV),
  ])
}
