/** Weekly load, muscle balance and progression per exercise. */
import { useMemo, useState } from 'react'
import Sheet from '../components/Sheet'
import Chart from '../components/Chart'
import { useApp } from '../lib/store'
import { muscleColor } from '../lib/exerciseMeta'
import { dayLabel, num, shortDate, volumeLabel } from '../lib/format'
import { exerciseHistory, muscleBreakdown, normalizeName, personalRecord, sessionSetsDone, sessionVolume, weeklyStats } from '../lib/stats'
import type { Exercise } from '../types'

type Metric = 'volume' | 'sessions' | 'sets'

export default function StatsView() {
  const { sessions, schede } = useApp()
  const [metric, setMetric] = useState<Metric>('volume')
  const [openExercise, setOpenExercise] = useState<string | null>(null)

  const done = sessions.filter((s) => s.done)
  const weeks = useMemo(() => weeklyStats(done, 8), [done])

  const exercisesByName = useMemo(() => {
    const map = new Map<string, Exercise>()
    for (const scheda of schede) {
      for (const day of scheda.days) {
        for (const ex of day.exercises) map.set(normalizeName(ex.name), ex)
      }
    }
    return map
  }, [schede])

  const muscles = useMemo(() => muscleBreakdown(done, exercisesByName), [done, exercisesByName])
  const maxMuscle = muscles.length ? muscles[0].sets : 1

  const trained = useMemo(() => {
    const names = new Map<string, { name: string; count: number }>()
    for (const s of done) {
      for (const [id, entry] of Object.entries(s.logs)) {
        if (!entry.sets.some((x) => x.done)) continue
        const name = s.names[id]
        if (!name) continue
        const key = normalizeName(name)
        const found = names.get(key)
        if (found) found.count += 1
        else names.set(key, { name, count: 1 })
      }
    }
    return [...names.values()].sort((a, b) => b.count - a.count)
  }, [done])

  if (!done.length) {
    return (
      <div className="empty fade-in">
        <h3>Nessun dato</h3>
        <p className="small">I grafici compaiono dopo il primo allenamento salvato.</p>
      </div>
    )
  }

  const values = weeks.map((w) => (metric === 'volume' ? w.volume : metric === 'sessions' ? w.sessions : w.sets))
  const max = Math.max(1, ...values)
  const totalVolume = done.reduce((a, s) => a + sessionVolume(s), 0)
  const totalSets = done.reduce((a, s) => a + sessionSetsDone(s), 0)

  return (
    <div className="fade-in">
      <div className="stat-grid">
        <div className="stat">
          <span className="value">{done.length}</span>
          <span className="label">allenamenti</span>
        </div>
        <div className="stat">
          <span className="value">{volumeLabel(totalVolume)}</span>
          <span className="label">volume totale</span>
        </div>
        <div className="stat">
          <span className="value">{totalSets}</span>
          <span className="label">serie totali</span>
        </div>
      </div>

      <div className="section-title">
        <span>Ultime 8 settimane</span>
      </div>
      <div className="card">
        <div className="row" style={{ gap: 6, marginBottom: 12 }}>
          {(['volume', 'sessions', 'sets'] as Metric[]).map((m) => (
            <button key={m} className={`chip ${metric === m ? 'accent' : ''}`} onClick={() => setMetric(m)}>
              {m === 'volume' ? 'volume' : m === 'sessions' ? 'sessioni' : 'serie'}
            </button>
          ))}
        </div>
        <div className="bars">
          {weeks.map((w, i) => (
            <div className={`bar ${i === weeks.length - 1 ? 'now' : ''}`} key={w.weekStart}>
              <i style={{ height: `${(values[i] / max) * 100}%` }} />
              <span>{shortDate(w.weekStart)}</span>
            </div>
          ))}
        </div>
        <p className="tiny muted" style={{ marginTop: 8, textAlign: 'center' }}>
          {metric === 'volume' ? volumeLabel(values[values.length - 1]) : values[values.length - 1]} questa settimana
        </p>
      </div>

      {muscles.length > 0 && (
        <>
          <div className="section-title">
            <span>Distribuzione muscolare</span>
          </div>
          <div className="card col" style={{ gap: 10 }}>
            {muscles.slice(0, 8).map((m) => (
              <div key={m.muscle} className="col" style={{ gap: 4 }}>
                <div className="row between">
                  <span className="small">{m.muscle}</span>
                  <span className="tiny muted">{m.sets} serie</span>
                </div>
                <div className="progress">
                  <span style={{ width: `${(m.sets / maxMuscle) * 100}%`, background: muscleColor(m.muscle) }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title">
        <span>Esercizi</span>
      </div>
      <div className="list">
        {trained.map((t) => {
          const record = personalRecord(done, t.name)
          const history = exerciseHistory(done, t.name)
          const trend =
            history.length > 1 ? history[history.length - 1].topWeight - history[0].topWeight : 0
          return (
            <button key={t.name} className="tile" onClick={() => setOpenExercise(t.name)}>
              <div className="col grow">
                <strong className="small truncate">{t.name}</strong>
                <span className="tiny muted">
                  {t.count} sessioni · {record ? `max ${num(record.weight, 1)} kg` : 'senza carico'}
                </span>
              </div>
              {trend !== 0 && (
                <span className="chip tiny" style={{ color: trend > 0 ? 'var(--accent)' : 'var(--danger)' }}>
                  {trend > 0 ? '+' : ''}
                  {num(trend, 1)} kg
                </span>
              )}
            </button>
          )
        })}
      </div>

      <Sheet open={!!openExercise} onClose={() => setOpenExercise(null)}>
        {openExercise && <ExercisePanel name={openExercise} />}
      </Sheet>
    </div>
  )
}

function ExercisePanel({ name }: { name: string }) {
  const { sessions } = useApp()
  const done = sessions.filter((s) => s.done)
  const history = exerciseHistory(done, name)
  const record = personalRecord(done, name)

  return (
    <div className="col" style={{ gap: 14 }}>
      <h2 style={{ fontSize: 19 }}>{name}</h2>
      {record && (
        <div className="stat-grid">
          <div className="stat">
            <span className="value">{num(record.weight, 1)}</span>
            <span className="label">kg record</span>
          </div>
          <div className="stat">
            <span className="value">{num(record.e1rm, 0)}</span>
            <span className="label">1RM stimato</span>
          </div>
          <div className="stat">
            <span className="value">{history.length}</span>
            <span className="label">sessioni</span>
          </div>
        </div>
      )}
      {history.length > 1 && (
        <div className="card col" style={{ gap: 6 }}>
          <span className="tiny muted">Carico massimo</span>
          <Chart points={history.map((h) => ({ date: h.date, value: h.topWeight }))} />
        </div>
      )}
      {history.length > 1 && (
        <div className="card col" style={{ gap: 6 }}>
          <span className="tiny muted">Volume per sessione</span>
          <Chart points={history.map((h) => ({ date: h.date, value: h.volume }))} />
        </div>
      )}
      <div className="list">
        {[...history].reverse().slice(0, 8).map((h) => (
          <div className="card col" key={h.sessionId + h.date} style={{ gap: 6 }}>
            <span className="tiny muted">{dayLabel(h.date)}</span>
            <div className="chips">
              {h.sets.map((s, i) => (
                <span className="chip tiny" key={i}>
                  {s.weight ? `${num(s.weight, 1)} kg` : 'libero'} x {s.reps ?? (s.seconds ? `${s.seconds}s` : '-')}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
