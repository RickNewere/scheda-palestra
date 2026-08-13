/** Guided session: one exercise at a time, loads typed in, rest timer running. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sheet from '../components/Sheet'
import ExerciseMedia from '../components/ExerciseMedia'
import ExerciseDetail, { targetLabel } from './ExerciseDetail'
import { IconCheck, IconChevron, IconClose, IconNote, IconPlay, IconTimer, IconTrophy } from '../components/icons'
import { useApp } from '../lib/store'
import { navigate } from '../lib/router'
import { formatClock, formatShortDuration } from '../lib/scheme'
import { minutesLabel, num, volumeLabel } from '../lib/format'
import { personalRecord, sessionSetsDone, sessionVolume } from '../lib/stats'
import { beepDone, beepEnd, beepTick, primeAudio, releaseWakeLock, requestWakeLock, vibrate } from '../lib/feedback'
import type { Exercise, Scheda, Session, SetLog } from '../types'

interface Props {
  session: Session
  scheda: Scheda | null
}

interface Timer {
  kind: 'rest' | 'work'
  endsAt: number
  total: number
}

function fallbackExercise(id: string, name: string): Exercise {
  return {
    id,
    col: 0,
    order: 0,
    name,
    scheme: '',
    schemes: {},
    sets: null,
    reps: null,
    durationSec: null,
    perSide: false,
    kind: 'reps',
    note: null,
    imageId: null,
    pattern: 'generic',
    muscles: [],
  }
}

export default function WorkoutView({ session, scheda }: Props) {
  const { saveSession, finishSession, deleteSession, settings, sessions } = useApp()
  const day = scheda?.days.find((d) => d.id === session.dayId) || null

  const exercises = useMemo<Exercise[]>(() => {
    if (day) return day.exercises
    return Object.keys(session.logs).map((id) => fallbackExercise(id, session.names[id] || 'Esercizio'))
  }, [day, session.logs, session.names])

  const restDefault = day?.restSeconds ?? 90
  const [index, setIndex] = useState(0)
  const [timer, setTimer] = useState<Timer | null>(null)
  const [now, setNow] = useState(Date.now())
  const [showList, setShowList] = useState(false)
  const [showFinish, setShowFinish] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const lastBeep = useRef(0)

  const current = exercises[Math.min(index, exercises.length - 1)]
  const log = current ? session.logs[current.id] : undefined

  useEffect(() => {
    void requestWakeLock(settings.keepAwake)
    return () => {
      void releaseWakeLock()
    }
  }, [settings.keepAwake])

  // Jump to the first exercise that still has open sets.
  useEffect(() => {
    const firstOpen = exercises.findIndex((ex) => (session.logs[ex.id]?.sets || []).some((s) => !s.done))
    if (firstOpen > 0) setIndex(firstOpen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!timer) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [timer])

  const remaining = timer ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : 0

  useEffect(() => {
    if (!timer) return
    if (remaining <= 3 && remaining > 0 && lastBeep.current !== remaining) {
      lastBeep.current = remaining
      beepTick(settings.sound)
    }
    if (remaining === 0) {
      beepEnd(settings.sound)
      vibrate(settings.vibration, [120, 60, 120])
      const finished = timer
      setTimer(null)
      lastBeep.current = 0
      if (finished.kind === 'work') completeRunningSet()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, timer])

  const runningSet = useRef<{ exerciseId: string; setIndex: number } | null>(null)

  const patchSet = useCallback(
    (exerciseId: string, setIndex: number, patch: Partial<SetLog>) => {
      const entry = session.logs[exerciseId]
      if (!entry) return
      const sets = entry.sets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s))
      void saveSession({ ...session, logs: { ...session.logs, [exerciseId]: { ...entry, sets } } })
    },
    [session, saveSession],
  )

  const completeRunningSet = useCallback(() => {
    const running = runningSet.current
    if (!running) return
    patchSet(running.exerciseId, running.setIndex, { done: true })
    runningSet.current = null
    setTimer({ kind: 'rest', endsAt: Date.now() + restDefault * 1000, total: restDefault })
  }, [patchSet, restDefault])

  if (!current || !log) {
    return (
      <div className="empty">
        <h3>Sessione vuota</h3>
        <button className="btn" onClick={() => navigate('/')}>
          Torna alla home
        </button>
      </div>
    )
  }

  const toggleSet = (i: number) => {
    primeAudio()
    const set = log.sets[i]
    const nextDone = !set.done
    // Marking a set done carries its load over to the sets still empty.
    const sets = log.sets.map((s, idx) => {
      if (idx === i) return { ...s, done: nextDone }
      if (nextDone && idx > i && s.weight === null && set.weight !== null) return { ...s, weight: set.weight }
      return s
    })
    void saveSession({ ...session, logs: { ...session.logs, [current.id]: { ...log, sets } } })
    if (nextDone) {
      beepDone(settings.sound)
      vibrate(settings.vibration, 40)
      if (settings.autoRest) {
        lastBeep.current = 0
        setTimer({ kind: 'rest', endsAt: Date.now() + restDefault * 1000, total: restDefault })
      }
    }
  }

  const startWorkTimer = (i: number) => {
    primeAudio()
    const seconds = log.sets[i].seconds ?? current.durationSec ?? 60
    runningSet.current = { exerciseId: current.id, setIndex: i }
    lastBeep.current = 0
    setTimer({ kind: 'work', endsAt: Date.now() + seconds * 1000, total: seconds })
  }

  const addSet = () => {
    const entry = session.logs[current.id]
    const last = entry.sets[entry.sets.length - 1]
    const sets = [...entry.sets, { ...last, done: false }]
    void saveSession({ ...session, logs: { ...session.logs, [current.id]: { ...entry, sets } } })
  }

  const removeSet = () => {
    const entry = session.logs[current.id]
    if (entry.sets.length <= 1) return
    void saveSession({
      ...session,
      logs: { ...session.logs, [current.id]: { ...entry, sets: entry.sets.slice(0, -1) } },
    })
  }

  const saveNote = () => {
    const entry = session.logs[current.id]
    void saveSession({ ...session, logs: { ...session.logs, [current.id]: { ...entry, note: noteDraft.trim() || undefined } } })
  }

  const totalSets = Object.values(session.logs).reduce((a, l) => a + l.sets.length, 0)
  const doneSets = sessionSetsDone(session)
  const progress = totalSets ? (doneSets / totalSets) * 100 : 0
  const record = personalRecord(sessions.filter((s) => s.id !== session.id), current.name)

  const goTo = (i: number) => {
    setIndex(Math.max(0, Math.min(exercises.length - 1, i)))
    setShowList(false)
    setNoteDraft('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isTimed = current.kind === 'time' || current.kind === 'cardio'

  return (
    <div className="fade-in">
      <div className="row between" style={{ marginBottom: 8 }}>
        <button className="chip" onClick={() => setShowList(true)}>
          esercizio {index + 1} di {exercises.length}
        </button>
        <span className="tiny muted">
          {doneSets}/{totalSets} serie
        </span>
      </div>
      <div className="progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
          <div className="col grow">
            <h2 style={{ fontSize: 19 }}>{current.name}</h2>
            <span className="tiny" style={{ color: 'var(--accent)', fontWeight: 650 }}>
              {targetLabel(current)}
            </span>
            {record && (
              <span className="tiny muted row" style={{ gap: 4 }}>
                <IconTrophy size={12} /> record {num(record.weight, 1)} kg x {record.reps}
              </span>
            )}
          </div>
          <button onClick={() => setShowDetail(true)} style={{ flex: 'none' }} aria-label="Dettagli">
            <ExerciseMedia exercise={current} />
          </button>
        </div>

        {current.note && (
          <div className="banner warn" style={{ marginTop: 12 }}>
            <IconNote size={13} /> {current.note}
          </div>
        )}

        <div className="col" style={{ gap: 8, marginTop: 14 }}>
          {log.sets.map((set, i) => (
            <div className="set-row" key={i}>
              <span className="idx">{i + 1}</span>
              <div className="stepper">
                <button onClick={() => patchSet(current.id, i, { weight: Math.max(0, (set.weight ?? 0) - settings.weightStep) })}>-</button>
                <input
                  className="grow"
                  type="number"
                  inputMode="decimal"
                  step={settings.weightStep}
                  value={set.weight ?? ''}
                  placeholder="-"
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => patchSet(current.id, i, { weight: e.target.value === '' ? null : parseFloat(e.target.value.replace(',', '.')) })}
                />
                <span className="unit">kg</span>
                <button onClick={() => patchSet(current.id, i, { weight: (set.weight ?? 0) + settings.weightStep })}>+</button>
              </div>

              {isTimed ? (
                <button className="btn slim" onClick={() => startWorkTimer(i)}>
                  <IconTimer size={15} /> {formatShortDuration(set.seconds ?? current.durationSec ?? 60)}
                </button>
              ) : (
                <div className="stepper">
                  <button onClick={() => patchSet(current.id, i, { reps: Math.max(0, (set.reps ?? 0) - 1) })}>-</button>
                  <input
                    className="grow"
                    type="number"
                    inputMode="numeric"
                    value={set.reps ?? ''}
                    placeholder="-"
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => patchSet(current.id, i, { reps: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                  />
                  <span className="unit">rip</span>
                  <button onClick={() => patchSet(current.id, i, { reps: (set.reps ?? 0) + 1 })}>+</button>
                </div>
              )}

              <button className={`check ${set.done ? 'on' : ''}`} onClick={() => toggleSet(i)} aria-label="Serie completata">
                <IconCheck size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <button className="btn slim grow" onClick={addSet}>
            + serie
          </button>
          <button className="btn slim grow" onClick={removeSet} disabled={log.sets.length <= 1}>
            - serie
          </button>
          <button
            className="btn slim grow"
            onClick={() => {
              lastBeep.current = 0
              primeAudio()
              setTimer({ kind: 'rest', endsAt: Date.now() + restDefault * 1000, total: restDefault })
            }}
          >
            <IconTimer size={15} /> recupero
          </button>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>Nota della sessione</label>
          <input
            type="text"
            value={noteDraft || log.note || ''}
            placeholder="Sensazioni, regolazioni macchina..."
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={saveNote}
          />
        </div>
      </div>

      <div className="row" style={{ gap: 10, marginTop: 14 }}>
        <button className="btn grow" onClick={() => goTo(index - 1)} disabled={index === 0}>
          Indietro
        </button>
        {index < exercises.length - 1 ? (
          <button className="btn primary grow" onClick={() => goTo(index + 1)}>
            Avanti <IconChevron size={16} />
          </button>
        ) : (
          <button className="btn primary grow" onClick={() => setShowFinish(true)}>
            Termina
          </button>
        )}
      </div>

      <button className="btn block" style={{ marginTop: 10 }} onClick={() => setShowFinish(true)}>
        Chiudi allenamento
      </button>

      <div style={{ height: 80 }} />

      {timer && (
        <div className={`rest ${remaining <= 3 ? 'ring' : ''}`}>
          <span className="time">{formatClock(remaining)}</span>
          <div className="col grow">
            <span className="tiny muted">{timer.kind === 'rest' ? 'recupero' : 'esecuzione'}</span>
            <div className="progress">
              <span style={{ width: `${(remaining / timer.total) * 100}%` }} />
            </div>
          </div>
          <button className="btn slim" onClick={() => setTimer({ ...timer, endsAt: timer.endsAt + 30000, total: timer.total + 30 })}>
            +30s
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              if (timer.kind === 'work') completeRunningSet()
              else setTimer(null)
            }}
            aria-label="Chiudi timer"
          >
            <IconClose size={18} />
          </button>
        </div>
      )}

      <Sheet open={showList} onClose={() => setShowList(false)}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Esercizi</h2>
        <div className="list">
          {exercises.map((ex, i) => {
            const entry = session.logs[ex.id]
            const done = entry ? entry.sets.filter((s) => s.done).length : 0
            const total = entry ? entry.sets.length : 0
            return (
              <button key={ex.id} className="tile" onClick={() => goTo(i)} style={i === index ? { borderColor: 'var(--accent)' } : undefined}>
                <ExerciseMedia exercise={ex} />
                <div className="col grow">
                  <strong className="truncate">{ex.name}</strong>
                  <span className="tiny muted">
                    {done}/{total} serie
                  </span>
                </div>
                {done === total && total > 0 && <IconCheck size={18} className="" />}
              </button>
            )
          })}
        </div>
      </Sheet>

      <Sheet open={showDetail} onClose={() => setShowDetail(false)}>
        {scheda && day && (
          <ExerciseDetail exercise={current} schedaId={scheda.id} dayId={day.id} onClose={() => setShowDetail(false)} />
        )}
      </Sheet>

      <Sheet open={showFinish} onClose={() => setShowFinish(false)}>
        <div className="col" style={{ gap: 14 }}>
          <h2 style={{ fontSize: 19 }}>Riepilogo</h2>
          <div className="stat-grid">
            <div className="stat">
              <span className="value">{doneSets}</span>
              <span className="label">serie</span>
            </div>
            <div className="stat">
              <span className="value">{volumeLabel(sessionVolume(session))}</span>
              <span className="label">volume</span>
            </div>
            <div className="stat">
              <span className="value">{minutesLabel(Date.now() - session.startedAt)}</span>
              <span className="label">durata</span>
            </div>
          </div>
          <button
            className="btn primary block"
            onClick={async () => {
              await finishSession(session)
              setShowFinish(false)
              navigate('/')
            }}
          >
            <IconCheck size={18} /> Salva allenamento
          </button>
          <button className="btn block" onClick={() => setShowFinish(false)}>
            Continua ad allenarti
          </button>
          <button
            className="btn danger block"
            onClick={async () => {
              if (!confirm('Eliminare questa sessione senza salvarla?')) return
              await deleteSession(session.id)
              navigate('/')
            }}
          >
            Elimina sessione
          </button>
        </div>
      </Sheet>

      {!timer && (
        <div className="fab-row" style={{ pointerEvents: 'none' }}>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button
              className="btn primary slim"
              style={{ pointerEvents: 'auto', boxShadow: 'var(--shadow)' }}
              onClick={() => {
                lastBeep.current = 0
                primeAudio()
                setTimer({ kind: 'rest', endsAt: Date.now() + restDefault * 1000, total: restDefault })
              }}
            >
              <IconPlay size={14} /> recupero {formatClock(restDefault)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
