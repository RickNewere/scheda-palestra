/** All exercises of one day, with the entry point to the workout. */
import { useState } from 'react'
import Sheet from '../components/Sheet'
import ExerciseMedia from '../components/ExerciseMedia'
import ExerciseDetail, { targetLabel } from './ExerciseDetail'
import { IconNote, IconPlay, IconPlus, IconTimer } from '../components/icons'
import { useApp } from '../lib/store'
import { navigate } from '../lib/router'
import { formatClock } from '../lib/scheme'
import { dayLabel, num } from '../lib/format'
import { lastEntryFor } from '../lib/stats'
import type { Day, Exercise, Scheda } from '../types'

interface Props {
  scheda: Scheda
  day: Day
}

export default function DayView({ scheda, day }: Props) {
  const { sessions, activeSession, startSession, addExercise, updateDay } = useApp()
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newScheme, setNewScheme] = useState('3x12')

  const start = async () => {
    if (activeSession && activeSession.dayId !== day.id) {
      if (!confirm('C’è già un allenamento in corso. Vuoi comunque iniziarne uno nuovo?')) return
    }
    if (activeSession && activeSession.dayId === day.id) {
      navigate('/workout')
      return
    }
    await startSession(scheda, day)
    navigate('/workout')
  }

  const changeRest = () => {
    const value = prompt('Recupero tra le serie (in secondi)', String(day.restSeconds))
    if (!value) return
    const parsed = parseInt(value, 10)
    if (!Number.isNaN(parsed) && parsed > 0) void updateDay(scheda.id, day.id, { restSeconds: parsed })
  }

  return (
    <div className="fade-in">
      <div className="row" style={{ gap: 8, marginBottom: 14 }}>
        <span className="chip">{day.exercises.length} esercizi</span>
        <button className="chip" onClick={changeRest}>
          <IconTimer size={13} /> recupero {formatClock(day.restSeconds)}
        </button>
      </div>

      <div className="list">
        {day.exercises.map((ex) => {
          const last = lastEntryFor(sessions, ex.name)
          return (
            <button key={ex.id} className="tile" onClick={() => setSelected(ex)}>
              <ExerciseMedia exercise={ex} />
              <div className="col grow">
                <strong className="truncate">{ex.name}</strong>
                <span className="tiny" style={{ color: 'var(--accent)', fontWeight: 650 }}>
                  {targetLabel(ex)}
                </span>
                {last ? (
                  <span className="tiny muted truncate">
                    ultima: {last.topWeight ? `${num(last.topWeight, 1)} kg` : 'senza carico'} · {dayLabel(last.date)}
                  </span>
                ) : (
                  <span className="tiny muted">nessuno storico</span>
                )}
                {ex.note && (
                  <span className="tiny truncate" style={{ color: 'var(--warn)' }}>
                    <IconNote size={11} /> {ex.note}
                  </span>
                )}
              </div>
            </button>
          )
        })}

        <button className="tile" style={{ justifyContent: 'center', color: 'var(--muted)' }} onClick={() => setAdding(true)}>
          <IconPlus size={18} /> Aggiungi esercizio
        </button>
      </div>

      <div style={{ height: 120 }} />
      <div className="fab-row">
        <button className="btn primary block" onClick={start}>
          <IconPlay size={18} />
          {activeSession && activeSession.dayId === day.id ? 'Riprendi allenamento' : 'Inizia allenamento'}
        </button>
      </div>

      <Sheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <ExerciseDetail
            exercise={day.exercises.find((e) => e.id === selected.id) || selected}
            schedaId={scheda.id}
            dayId={day.id}
            onClose={() => setSelected(null)}
          />
        )}
      </Sheet>

      <Sheet open={adding} onClose={() => setAdding(false)}>
        <div className="col" style={{ gap: 14 }}>
          <h2 style={{ fontSize: 18 }}>Nuovo esercizio</h2>
          <div className="field">
            <label>Nome</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Es. Panca piana" autoFocus />
          </div>
          <div className="field">
            <label>Serie</label>
            <input type="text" value={newScheme} onChange={(e) => setNewScheme(e.target.value)} placeholder="3x12" />
          </div>
          <button
            className="btn primary block"
            disabled={!newName.trim()}
            onClick={async () => {
              await addExercise(scheda.id, day.id, newName.trim(), newScheme.trim() || '3x12')
              setNewName('')
              setNewScheme('3x12')
              setAdding(false)
            }}
          >
            Aggiungi
          </button>
        </div>
      </Sheet>
    </div>
  )
}
