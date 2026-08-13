/** Import of a scheda from an Excel file, as a new plan or as an update. */
import { useRef, useState } from 'react'
import { IconCheck, IconPlus, IconUpload } from '../components/icons'
import { useApp, type ImportCandidate } from '../lib/store'
import { navigate } from '../lib/router'
import { dayLabel } from '../lib/format'

interface Props {
  /** Scheda to update, when the import was started from the settings. */
  targetId?: string
}

export default function ImportView({ targetId }: Props) {
  const { prepareImport, commitImport, schede } = useApp()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidate, setCandidate] = useState<ImportCandidate | null>(null)
  const [done, setDone] = useState<{ name: string; days: number; exercises: number; replaced: boolean; warnings: string[] } | null>(null)

  const target = targetId ? schede.find((s) => s.id === targetId) || null : null
  const suggested = target || candidate?.duplicate || null

  const countExercises = (c: ImportCandidate) => c.scheda.days.reduce((a, d) => a + d.exercises.length, 0)

  const handle = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    setDone(null)
    setCandidate(null)
    try {
      const parsed = await prepareImport(file)
      const replaceTarget = target || parsed.duplicate
      if (replaceTarget) {
        setCandidate(parsed)
      } else {
        await save(parsed, undefined)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante la lettura del file')
    } finally {
      setBusy(false)
    }
  }

  const save = async (c: ImportCandidate, replaceId: string | undefined) => {
    setBusy(true)
    try {
      const scheda = await commitImport(c, replaceId)
      setDone({
        name: scheda.name,
        days: scheda.days.length,
        exercises: scheda.days.reduce((a, d) => a + d.exercises.length, 0),
        replaced: !!replaceId,
        warnings: c.warnings,
      })
      setCandidate(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante il salvataggio')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fade-in">
      {target && !done && (
        <div className="banner ok" style={{ marginBottom: 12 }}>
          Stai aggiornando <strong>{target.name}</strong> (importata {dayLabel(target.importedAt)}).
        </div>
      )}

      {!candidate && !done && (
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
      )}

      {error && (
        <div className="banner error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      {candidate && suggested && (
        <div className="col" style={{ gap: 12 }}>
          <div className="card col" style={{ gap: 6 }}>
            <span className="tiny muted">File letto</span>
            <strong>{candidate.scheda.sourceFile}</strong>
            <span className="small muted">
              {candidate.scheda.days.length} giorni · {countExercises(candidate)} esercizi
            </span>
          </div>

          <div className="banner warn">
            Assomiglia a <strong>{suggested.name}</strong>, già presente. Come la salvo?
          </div>

          <button className="btn primary block" disabled={busy} onClick={() => void save(candidate, suggested.id)}>
            <IconCheck size={18} /> Aggiorna {suggested.name}
          </button>
          <p className="tiny muted" style={{ textAlign: 'center' }}>
            I giorni vengono rimodulati sul nuovo file. Storico e record restano, gli esercizi aggiunti a mano
            vengono riportati nei giorni corrispondenti.
          </p>

          <button className="btn block" disabled={busy} onClick={() => void save(candidate, undefined)}>
            <IconPlus size={18} /> Tieni entrambe e aggiungi come nuova
          </button>
          <button className="btn block" disabled={busy} onClick={() => setCandidate(null)}>
            Annulla
          </button>
        </div>
      )}

      {done && (
        <div className="col" style={{ gap: 10 }}>
          <div className="banner ok">
            <strong>{done.name}</strong> {done.replaced ? 'aggiornata' : 'importata'}: {done.days} giorni,{' '}
            {done.exercises} esercizi.
          </div>
          {done.warnings.map((w) => (
            <div className="banner warn" key={w}>
              {w}
            </div>
          ))}
          <button className="btn primary block" onClick={() => navigate('/')}>
            Vai alla scheda
          </button>
          <button
            className="btn block"
            onClick={() => {
              setDone(null)
              setCandidate(null)
            }}
          >
            Importa un altro file
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
        <p>Puoi importare quante schede vuoi: si passa dall&apos;una all&apos;altra dalle impostazioni.</p>
      </div>
    </div>
  )
}
