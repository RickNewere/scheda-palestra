/** Every saved session, newest first. */
import { useState } from 'react'
import Sheet from '../components/Sheet'
import { IconChevron, IconTrash } from '../components/icons'
import { useApp } from '../lib/store'
import { navigate } from '../lib/router'
import { dayLabel, fullDate, hourMinute, minutesLabel, num, volumeLabel } from '../lib/format'
import { isTracked, sessionDuration, sessionSetsDone, sessionVolume } from '../lib/stats'

export default function HistoryView() {
  const { sessions, deleteSession } = useApp()
  const [openId, setOpenId] = useState<string | null>(null)
  // An open session with sets already ticked belongs to the history too.
  const done = sessions.filter(isTracked)
  const open = done.find((s) => s.id === openId) || null

  if (!done.length) {
    return (
      <div className="empty fade-in">
        <h3>Ancora nessun allenamento</h3>
        <p className="small">Quando salvi una sessione la ritrovi qui con carichi e volume.</p>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="list">
        {done.map((s) => (
          <button
            key={s.id}
            className="tile"
            style={s.done ? undefined : { borderColor: 'var(--accent)' }}
            onClick={() => setOpenId(s.id)}
          >
            <div className="col grow">
              <div className="row" style={{ gap: 6 }}>
                <strong className="truncate">{s.dayTitle}</strong>
                {!s.done && <span className="chip accent tiny">in corso</span>}
              </div>
              <span className="tiny muted">
                {dayLabel(s.startedAt)} · {hourMinute(s.startedAt)} · {s.schedaName}
              </span>
              <div className="chips" style={{ marginTop: 4 }}>
                <span className="chip tiny">{sessionSetsDone(s)} serie</span>
                <span className="chip tiny">{volumeLabel(sessionVolume(s))}</span>
                {sessionDuration(s) > 0 && <span className="chip tiny">{minutesLabel(sessionDuration(s))}</span>}
              </div>
            </div>
            <IconChevron size={20} className="muted" />
          </button>
        ))}
      </div>

      <Sheet open={!!open} onClose={() => setOpenId(null)}>
        {open && (
          <div className="col" style={{ gap: 14 }}>
            <div className="col">
              <h2 style={{ fontSize: 19 }}>{open.dayTitle}</h2>
              <span className="tiny muted">
                {fullDate(open.startedAt)} · {hourMinute(open.startedAt)}
              </span>
            </div>

            {!open.done && (
              <div className="banner ok row between">
                <span>Allenamento ancora aperto, i carichi sono salvati.</span>
                <button className="btn slim" onClick={() => navigate('/workout')}>
                  Riprendi
                </button>
              </div>
            )}

            <div className="stat-grid">
              <div className="stat">
                <span className="value">{sessionSetsDone(open)}</span>
                <span className="label">serie</span>
              </div>
              <div className="stat">
                <span className="value">{volumeLabel(sessionVolume(open))}</span>
                <span className="label">volume</span>
              </div>
              <div className="stat">
                <span className="value">{sessionDuration(open) ? minutesLabel(sessionDuration(open)) : '-'}</span>
                <span className="label">durata</span>
              </div>
            </div>

            <div className="list">
              {Object.entries(open.logs).map(([id, entry]) => {
                const sets = entry.sets.filter((s) => s.done)
                if (!sets.length) return null
                return (
                  <div className="card col" key={id} style={{ gap: 6 }}>
                    <strong className="small">{open.names[id] || 'Esercizio'}</strong>
                    <div className="chips">
                      {sets.map((s, i) => (
                        <span className="chip tiny" key={i}>
                          {s.weight ? `${num(s.weight, 1)} kg` : 'libero'} x {s.reps ?? (s.seconds ? `${s.seconds}s` : '-')}
                        </span>
                      ))}
                    </div>
                    {entry.note && <span className="tiny muted">{entry.note}</span>}
                  </div>
                )
              })}
            </div>

            <button
              className="btn danger block"
              onClick={async () => {
                if (!confirm('Eliminare questo allenamento?')) return
                await deleteSession(open.id)
                setOpenId(null)
              }}
            >
              <IconTrash size={17} /> Elimina allenamento
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
