/** Hash router: keeps the Android back button working out of the box. */
import { useSyncExternalStore } from 'react'

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, '')
  return hash || '/'
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, currentPath, () => '/')
}

export function useSegments(): string[] {
  const path = usePath()
  return path.split('/').filter(Boolean)
}

export function navigate(path: string, replace = false): void {
  const target = `#${path.startsWith('/') ? path : `/${path}`}`
  if (replace) {
    window.history.replaceState(null, '', target)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = target
  }
}

export function goBack(): void {
  if (window.history.length > 1) window.history.back()
  else navigate('/')
}
