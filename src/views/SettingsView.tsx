/** Schede management, preferences and backup. */
import { useRef, useState } from 'react'
import { IconCheck, IconEdit, IconPlus, IconTrash, IconUpload } from '../components/icons'
import { useApp } from '../lib/store'
import { navigate } from '../lib/router'
import { dayLabel } from '../lib/format'

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button className="row between" style={{ width: '100%', padding: '6px 0' }} onClick={() => onChange(!on)}>
      <div className="col" style={{ textAlign: 'left' }}>
        <span className="small">{label}</span>
        {hint && <span className="tiny muted">{hint}</span>}
      </div>
      <span className={`switch ${on ? 'on' : ''}`} />
    </button>
  )
}

export default function SettingsView() {
  const { schede, settings, activeScheda, setActiveScheda, renameScheda, deleteScheda, setVariant, updateSettings, exportBackup, importBackup, resetAll, sessions } = useApp()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  const doExport = async () => {
    const json = await exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scheda-palestra-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    setMessage('Backup scaricato')
  }

  const doImport = async (file: File | undefined) => {
    if (!file) return
    try {
      await importBackup(await file.text())
      setMessage('Backup ripristinato')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Backup non valido')
    }
  }

  return (
    <div className="fade-in">
      {message && (
        <div className="banner ok" style={{ marginBottom: 12 }}>
          {message}
        </div>
      )}

      <div className="section-title">
        <span>Schede</span>
        <button className="tiny" style={{ color: 'var(--accent)' }} onClick={() => navigate('/import')}>
          <IconPlus size={13} /> importa
        </button>
      </div>

      <div className="list">
        {schede.map((s) => (
          <div key={s.id} className={`tile ${s.id === activeScheda?.id ? '' : ''}`} style={s.id === activeScheda?.id ? { borderColor: 'var(--accent)' } : undefined}>
            <button className="col grow" style={{ textAlign: 'left' }} onClick={() => void setActiveScheda(s.id)}>
              <strong className="small truncate">{s.name}</strong>
              <span className="tiny muted">
                {s.days.length} giorni · importata {dayLabel(s.importedAt)}
              </span>
              {s.variants.length > 1 && (
                <div className="chips" style={{ marginTop: 6 }}>
                  {s.variants.map((v) => (
                    <button
                      key={v}
                      className={`chip tiny ${s.variant === v ? 'accent' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        void setVariant(s.id, v)
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </button>
            {s.id === activeScheda?.id && <IconCheck size={18} className="" />}
            <div className="col" style={{ gap: 4 }}>
              <button
                className="icon-btn ghost"
                onClick={() => navigate(`/import/${s.id}`)}
                aria-label="Aggiorna da file"
                title="Aggiorna da file"
              >
                <IconUpload size={17} />
              </button>
              <button
                className="icon-btn ghost"
                onClick={() => {
                  const name = prompt('Nome della scheda', s.name)
                  if (name?.trim()) void renameScheda(s.id, name.trim())
                }}
                aria-label="Rinomina"
              >
                <IconEdit size={17} />
              </button>
              <button
                className="icon-btn ghost"
                onClick={() => {
                  if (confirm(`Eliminare "${s.name}"? Lo storico resta salvato.`)) void deleteScheda(s.id)
                }}
                aria-label="Elimina"
              >
                <IconTrash size={17} />
              </button>
            </div>
          </div>
        ))}
        {!schede.length && (
          <button className="btn block" onClick={() => navigate('/import')}>
            Importa la prima scheda
          </button>
        )}
      </div>

      <div className="section-title">
        <span>Allenamento</span>
      </div>
      <div className="card col" style={{ gap: 4 }}>
        <Toggle
          on={settings.autoRest}
          onChange={(v) => void updateSettings({ autoRest: v })}
          label="Recupero automatico"
          hint="Parte il timer quando spunti una serie"
        />
        <Toggle on={settings.sound} onChange={(v) => void updateSettings({ sound: v })} label="Suoni" hint="Bip a fine recupero" />
        <Toggle on={settings.vibration} onChange={(v) => void updateSettings({ vibration: v })} label="Vibrazione" />
        <Toggle
          on={settings.keepAwake}
          onChange={(v) => void updateSettings({ keepAwake: v })}
          label="Schermo sempre acceso"
          hint={"Durante l'allenamento"}
        />
        <div className="row between" style={{ paddingTop: 8 }}>
          <div className="col">
            <span className="small">Incremento carico</span>
            <span className="tiny muted">Passo dei pulsanti + e -</span>
          </div>
          <div className="chips">
            {[1, 1.25, 2.5, 5].map((step) => (
              <button
                key={step}
                className={`chip ${settings.weightStep === step ? 'accent' : ''}`}
                onClick={() => void updateSettings({ weightStep: step })}
              >
                {String(step).replace('.', ',')} kg
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-title">
        <span>Dati</span>
      </div>
      <div className="card col" style={{ gap: 10 }}>
        <div className="row between">
          <span className="small muted">
            {schede.length} schede · {sessions.filter((s) => s.done).length} allenamenti salvati
          </span>
        </div>
        <button className="btn block" onClick={doExport}>
          Esporta backup
        </button>
        <button className="btn block" onClick={() => fileInput.current?.click()}>
          Ripristina backup
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => void doImport(e.target.files?.[0])}
        />
        <button
          className="btn danger block"
          onClick={async () => {
            if (!confirm('Cancellare schede, storico e impostazioni? Operazione non reversibile.')) return
            await resetAll()
            setMessage('Dati cancellati')
            navigate('/')
          }}
        >
          Cancella tutti i dati
        </button>
      </div>

      <p className="tiny muted" style={{ textAlign: 'center', marginTop: 20 }}>
        Scheda Palestra · i dati restano sul dispositivo
      </p>
    </div>
  )
}
