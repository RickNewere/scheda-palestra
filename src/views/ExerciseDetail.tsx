/** Detail of a single exercise: media, target, notes, records and history. */
import { useMemo, useState } from 'react'
import ExerciseMedia from '../components/ExerciseMedia'
import Chart from '../components/Chart'
import { IconEdit, IconTrash, IconTrophy } from '../components/icons'
import { useApp } from '../lib/store'
import { muscleColor } from '../lib/exerciseMeta'
import { formatShortDuration } from '../lib/scheme'
import { dayLabel, kg, num } from '../lib/format'
import { exerciseHistory, personalRecord } from '../lib/stats'
import type { Exercise } from '../types'

interface Props {
  exercise: Exercise
  schedaId: string
  dayId: string
  onClose: () => void
}

export function targetLabel(ex: Exercise): string {
  const sets = ex.sets ?? 1
  if (ex.kind === 'time' || ex.kind === 'cardio') {
    const d = ex.durationSec ? formatShortDuration(ex.durationSec) : '?'
    return `${sets} x ${d}${ex.perSide ? ' per lato' : ''}`
  }
  return `${sets} x ${ex.reps ?? '?'}${ex.perSide ? ' per lato' : ''}`
}

export default function ExerciseDetail({ exercise, schedaId, dayId, onClose }: Props) {
  const { sessions, updateExercise, deleteExercise, moveExercise } = useApp()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(exercise.name)
  const [scheme, setScheme] = useState(exercise.scheme)
  const [note, setNote] = useState(exercise.note || '')

  const history = useMemo(() => exerciseHistory(sessions, exercise.name), [sessions, exercise.name])
  const record = useMemo(() => personalRecord(sessions, exercise.name), [sessions, exercise.name])
  const last = history.length ? history[history.length - 1] : null

  const save = async () => {
    await updateExercise(schedaId, dayId, exercise.id, {
      name: name.trim() || exercise.name,
      scheme: scheme.trim(),
      note: note.trim() || null,
    })
    setEditing(false)
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row between">
        <h2 style={{ fontSize: 19 }}>{exercise.name}</h2>
        <button className="icon-btn ghost" onClick={() => setEditing((v) => !v)} aria-label="Modifica">
          <IconEdit size={20} />
        </button>
      </div>

      <ExerciseMedia exercise={exercise} size="big" toggle />

      <div className="chips">
        <span className="chip accent">{targetLabel(exercise)}</span>
        {exercise.muscles.map((m) => (
          <span className="chip" key={m}>
            <i className="dot" style={{ background: muscleColor(m) }} />
            {m}
          </span>
        ))}
      </div>

      {exercise.note && !editing && (
        <div className="banner warn">
          <strong>Nota: </strong>
          {exercise.note}
        </div>
      )}

      {editing && (
        <div className="card col" style={{ gap: 12 }}>
          <div className="field">
            <label>Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Serie (es. 3x12, 10 min, 3x30sec)</label>
            <input type="text" value={scheme} onChange={(e) => setScheme(e.target.value)} />
          </div>
          <div className="field">
            <label>Nota</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nessuna nota" />
          </div>
          <div className="row">
            <button className="btn slim" onClick={() => void moveExercise(schedaId, dayId, exercise.id, -1)}>
              Su
            </button>
            <button className="btn slim" onClick={() => void moveExercise(schedaId, dayId, exercise.id, 1)}>
              Giù
            </button>
            <span className="tiny muted">ordine nel giorno</span>
          </div>
          <div className="row">
            <button className="btn primary grow" onClick={save}>
              Salva
            </button>
            <button
              className="btn danger"
              onClick={async () => {
                if (confirm(`Eliminare "${exercise.name}" dal giorno?`)) {
                  await deleteExercise(schedaId, dayId, exercise.id)
                  onClose()
                }
              }}
              aria-label="Elimina"
            >
              <IconTrash size={18} />
            </button>
          </div>
        </div>
      )}

      {record && (
        <div className="card row" style={{ gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(251, 191, 36, 0.14)',
              color: 'var(--warn)',
              flex: 'none',
            }}
          >
            <IconTrophy size={22} />
          </div>
          <div className="col grow">
            <span className="tiny muted">Record personale</span>
            <strong>
              {kg(record.weight)} x {record.reps}
            </strong>
            <span className="tiny muted">
              {dayLabel(record.date)} · 1RM stimato {num(record.e1rm, 0)} kg
            </span>
          </div>
        </div>
      )}

      {last && (
        <div className="card col" style={{ gap: 8 }}>
          <span className="tiny muted">Ultima volta · {dayLabel(last.date)}</span>
          <div className="chips">
            {last.sets.map((s, i) => (
              <span className="chip" key={i}>
                {s.weight ? `${num(s.weight, 1)} kg` : '-'} x {s.reps ?? (s.seconds ? `${s.seconds}s` : '-')}
              </span>
            ))}
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div className="card col" style={{ gap: 6 }}>
          <span className="tiny muted">Progressione carico massimo</span>
          <Chart points={history.map((h) => ({ date: h.date, value: h.topWeight }))} />
        </div>
      )}

      {!history.length && (
        <p className="small muted" style={{ textAlign: 'center', padding: '8px 0' }}>
          Nessun dato registrato. Avvia l&apos;allenamento e inserisci i carichi.
        </p>
      )}
    </div>
  )
}
