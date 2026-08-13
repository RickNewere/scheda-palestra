import { useEffect } from 'react'
import { AppProvider, useApp } from './lib/store'
import { goBack, navigate, useSegments } from './lib/router'
import { IconBack, IconChart, IconHistory, IconHome, IconSettings } from './components/icons'
import HomeView from './views/HomeView'
import DayView from './views/DayView'
import WorkoutView from './views/WorkoutView'
import HistoryView from './views/HistoryView'
import StatsView from './views/StatsView'
import SettingsView from './views/SettingsView'
import ImportView from './views/ImportView'
import AnimationGallery from './views/AnimationGallery'

function Shell() {
  const { ready, activeScheda, activeSession, schede } = useApp()
  const segments = useSegments()
  const root = segments[0] || 'home'

  useEffect(() => {
    if (root === 'workout' && ready && !activeSession) navigate('/', true)
  }, [root, ready, activeSession])

  if (!ready) {
    return (
      <div className="app">
        <div className="empty" style={{ marginTop: '40dvh' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p className="small muted">caricamento scheda...</p>
        </div>
      </div>
    )
  }

  const day =
    root === 'day' ? schede.flatMap((s) => s.days.map((d) => ({ scheda: s, day: d }))).find((x) => x.day.id === segments[1]) : undefined

  const titles: Record<string, string> = {
    home: 'Oggi',
    history: 'Storico',
    stats: 'Progressi',
    settings: 'Impostazioni',
    import: 'Importa scheda',
    workout: activeSession?.dayTitle || 'Allenamento',
    day: day?.day.title || 'Giorno',
  }

  const subtitle: Record<string, string | undefined> = {
    home: activeScheda?.name,
    day: day?.day.label,
    workout: activeSession?.dayLabel,
  }

  const nested = root === 'day' || root === 'workout' || root === 'import'

  return (
    <div className="app">
      <header className="topbar">
        {nested && (
          <button className="icon-btn" onClick={goBack} aria-label="Indietro">
            <IconBack size={20} />
          </button>
        )}
        <div className="col grow">
          {subtitle[root] && <span className="sub">{subtitle[root]}</span>}
          <h1>{titles[root] || 'Scheda Palestra'}</h1>
        </div>
      </header>

      <main className="screen">
        {root === 'home' && <HomeView />}
        {root === 'day' && day && <DayView scheda={day.scheda} day={day.day} />}
        {root === 'day' && !day && (
          <div className="empty">
            <h3>Giorno non trovato</h3>
            <button className="btn" onClick={() => navigate('/')}>
              Torna alla home
            </button>
          </div>
        )}
        {root === 'workout' && activeSession && (
          <WorkoutView session={activeSession} scheda={schede.find((s) => s.id === activeSession.schedaId) || null} />
        )}
        {root === 'history' && <HistoryView />}
        {root === 'stats' && <StatsView />}
        {root === 'settings' && <SettingsView />}
        {root === 'import' && <ImportView />}
        {root === 'anim' && import.meta.env.DEV && <AnimationGallery />}
      </main>

      {root !== 'workout' && (
        <nav className="tabbar">
          <button className={root === 'home' || root === 'day' ? 'active' : ''} onClick={() => navigate('/')}>
            <IconHome />
            Oggi
          </button>
          <button className={root === 'history' ? 'active' : ''} onClick={() => navigate('/history')}>
            <IconHistory />
            Storico
          </button>
          <button className={root === 'stats' ? 'active' : ''} onClick={() => navigate('/stats')}>
            <IconChart />
            Progressi
          </button>
          <button className={root === 'settings' || root === 'import' ? 'active' : ''} onClick={() => navigate('/settings')}>
            <IconSettings />
            Altro
          </button>
        </nav>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
