/** Import of a new scheda from an Excel file. */
import { useRef, useState } from 'react'
import { IconUpload } from '../components/icons'
import { useApp } from '../lib/store'
import { navigate } from '../lib/router'

export default function ImportView() {
  const { importFile } = useApp()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ name: string; days: number; exercises: number; warnings: string[] } | null>(null)

  const handle = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const outcome = await importFile(file)
      setResult({
        name: outcome.scheda.name,
        days: outcome.scheda.days.length,
        exercises: outcome.scheda.days.reduce((a, d) => a + d.exercises.length, 0),
        warnings: outcome.warnings,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante la lettura del file')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fade-in">
      <div
        className={`dropzone ${over ? 'over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void handle(e.dataTransfer.files[0])
        }}
        onClick={() => input.current?.click()}
      >
        {busy ? (
          <div className="row" style={{ justifyContent: 'center' }}>
            <div className="spinner" /> <span className="small muted">lettura del file...</span>
          </div>
        ) : (
          <>
            <IconUpload size={30} className="muted" />
            <h3 style={{ marginTop: 10 }}>Trascina qui il file .xlsx</h3>
            <p className="small muted">oppure tocca per sceglierlo dal dispositivo</p>
          </>
        )}
        <input
          ref={input}
          type="file"
          accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ display: 'none' }}
          onChange={(e) => void handle(e.target.files?.[0])}
        />
      </div>

      {error && (
        <div className="banner error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      {result && (
        <div className="col" style={{ gap: 10, marginTop: 12 }}>
          <div className="banner ok">
            <strong>{result.name}</strong> importata: {result.days} giorni, {result.exercises} esercizi.
          </div>
          {result.warnings.map((w) => (
            <div className="banner warn" key={w}>
              {w}
            </div>
          ))}
          <button className="btn primary block" onClick={() => navigate('/')}>
            Vai alla scheda
          </button>
        </div>
      )}

      <div className="section-title">
        <span>Come deve essere il file</span>
      </div>
      <div className="card col small muted" style={{ gap: 10 }}>
        <p>Il foglio viene letto cercando i blocchi giorno, uno sotto l&apos;altro o affiancati:</p>
        <ul className="col" style={{ gap: 6 }}>
          <li>
            una cella con scritto <strong style={{ color: 'var(--text)' }}>Giorno 1</strong> apre il blocco
          </li>
          <li>
            la riga sotto contiene il <strong style={{ color: 'var(--text)' }}>titolo</strong> nella stessa colonna e i{' '}
            <strong style={{ color: 'var(--text)' }}>nomi degli esercizi</strong> nelle colonne a destra
          </li>
          <li>
            la riga successiva porta le serie, es. <strong style={{ color: 'var(--text)' }}>3x12</strong>,{' '}
            <strong style={{ color: 'var(--text)' }}>10 min</strong>, <strong style={{ color: 'var(--text)' }}>3x30sec</strong>
          </li>
          <li>
            una riga <strong style={{ color: 'var(--text)' }}>Recupero 3&apos;</strong> imposta il timer e le celle a destra
            diventano note dell&apos;esercizio
          </li>
          <li>le immagini incollate nel foglio vengono associate alla colonna su cui sono centrate</li>
        </ul>
        <p>Se il nome contiene più varianti di serie su righe diverse, puoi cambiarle dalle impostazioni.</p>
      </div>
    </div>
  )
}
