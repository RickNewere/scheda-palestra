/** Landing screen: which day to train, plus the week at a glance. */
import { useMemo } from 'react'
import { useApp } from '../lib/store'
import { IconChevron, IconFlame, IconPlay } from '../components/icons'
import { muscleColor } from '../lib/exerciseMeta'
import { dayLabel, volumeLabel } from '../lib/format'
import { normalizeName, sessionVolume, startOfWeek, streak } from '../lib/stats'
import type { Day, Session } from '../types'
import { navigate } from '../lib/router'

/** Matches on the day title too, so history survives a re-import of the scheda. */
export function lastSessionForDay(sessions: Session[], day: Day): Session | null {
  const title = normalizeName(day.title)
  const matches = sessions.filter((s) => s.done && (s.dayId === day.id || normalizeName(s.dayTitle) === title))
  return matches.length ? matches.reduce((a, b) => (a.startedAt > b.startedAt ? a : b)) : null
}

export default function HomeView() {
  const { activeScheda, sessions, activeSession, schede } = useApp()

  const weekSessions = useMemo(() => {
    const from = startOfWeek(Date.now())
    return sessions.filter((s) => s.done && s.startedAt >= from)
  }, [sessions])

  const weekVolume = weekSessions.reduce((acc, s) => acc + sessionVolume(s), 0)
  const currentStreak = useMemo(() => streak(sessions), [sessions])

  const suggestion = useMemo(() => {
    if (!activeScheda) return null
    let best: { day: Day; ts: number } | null = null
    for (const day of activeScheda.days) {
      const last = lastSessionForDay(sessions, day)
      const ts = last ? last.startedAt : 0
      if (!best || ts < best.ts) best = { day, ts }
    }
    return best?.day ?? null
  }, [activeScheda, sessions])

  if (!activeScheda) {
    return (
      <div className="empty fade-in">
        <h3>Nessuna scheda</h3>
        <p className="small">Importa il file Excel della tua scheda per iniziare.</p>
        <button className="btn primary" style={{ marginTop: 16 }} onClick={() => navigate('/import')}>
          Importa scheda
        </button>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {activeSession && (
        <button className="card row between" style={{ width: '100%', textAlign: 'left', borderColor: 'var(--accent)' }} onClick={() => navigate('/workout')}>
          <div className="col">
            <span className="tiny" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              ALLENAMENTO IN CORSO
            </span>
            <strong>{activeSession.dayTitle}</strong>
            <span className="tiny muted">iniziato {dayLabel(activeSession.startedAt)}</span>
          </div>
          <span className="btn primary slim">
            <IconPlay size={16} /> Riprendi
          </span>
        </button>
      )}

      <div className="stat-grid" style={{ marginTop: activeSession ? 12 : 0 }}>
        <div className="stat">
          <span className="value">{weekSessions.length}</span>
          <span className="label">sessioni sett.</span>
        </div>
        <div className="stat">
          <span className="value">{volumeLabel(weekVolume)}</span>
          <span className="label">volume sett.</span>
        </div>
        <div className="stat">
          <span className="value row" style={{ gap: 4 }}>
            {currentStreak}
            <IconFlame size={16} className="" />
          </span>
          <span className="label">giorni serie</span>
        </div>
      </div>

      <div className="section-title">
        <span>Giorni</span>
        {schede.length > 1 && (
          <button className="tiny" style={{ color: 'var(--accent)' }} onClick={() => navigate('/settings')}>
            cambia scheda
          </button>
        )}
      </div>

      <div className="list">
        {activeScheda.days.map((day) => {
          const last = lastSessionForDay(sessions, day)
          const muscles = [...new Set(day.exercises.flatMap((e) => e.muscles))].slice(0, 4)
          const isNext = suggestion?.id === day.id
          return (
            <button
              key={day.id}
              className={`tile day-card ${last ? 'done' : ''}`}
              style={isNext ? { borderColor: 'var(--accent)' } : undefined}
              onClick={() => navigate(`/day/${day.id}`)}
            >
              <div className="index">{day.index}</div>
              <div className="col grow">
                <div className="row" style={{ gap: 6 }}>
                  <strong className="truncate">{day.title}</strong>
                  {isNext && <span className="chip accent tiny">prossimo</span>}
                </div>
                <span className="tiny muted">
                  {day.exercises.length} esercizi · {last ? `ultima ${dayLabel(last.startedAt)}` : 'mai svolto'}
                </span>
                <div className="chips" style={{ marginTop: 4 }}>
                  {muscles.map((m) => (
                    <span className="chip tiny" key={m}>
                      <i className="dot" style={{ background: muscleColor(m) }} />
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <IconChevron size={20} className="muted" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
