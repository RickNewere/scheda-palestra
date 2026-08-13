/** Beeps, vibration and wake lock used during a workout. */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Called on the first user gesture so mobile browsers allow sound later on. */
export function primeAudio(): void {
  const a = audio()
  if (!a) return
  const osc = a.createOscillator()
  const gain = a.createGain()
  gain.gain.value = 0
  osc.connect(gain).connect(a.destination)
  osc.start()
  osc.stop(a.currentTime + 0.01)
}

function tone(freq: number, duration: number, at: number, volume = 0.18): void {
  const a = audio()
  if (!a) return
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  const start = a.currentTime + at
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(a.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

export function beepTick(enabled: boolean): void {
  if (!enabled) return
  tone(880, 0.09, 0, 0.12)
}

export function beepEnd(enabled: boolean): void {
  if (!enabled) return
  tone(660, 0.16, 0)
  tone(880, 0.16, 0.18)
  tone(1180, 0.3, 0.36)
}

export function beepDone(enabled: boolean): void {
  if (!enabled) return
  tone(720, 0.1, 0, 0.14)
  tone(960, 0.14, 0.1, 0.14)
}

export function vibrate(enabled: boolean, pattern: number | number[]): void {
  if (!enabled) return
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      /* not supported */
    }
  }
}

interface WakeLockSentinelLike {
  release: () => Promise<void>
}

let wakeLock: WakeLockSentinelLike | null = null

export async function requestWakeLock(enabled: boolean): Promise<void> {
  if (!enabled) return
  const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } }
  if (!nav.wakeLock) return
  try {
    wakeLock = await nav.wakeLock.request('screen')
  } catch {
    wakeLock = null
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    await wakeLock?.release()
  } catch {
    /* already released */
  }
  wakeLock = null
}
