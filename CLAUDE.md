# CLAUDE.md

Workout tracker (webapp/PWA) that builds a training plan from an Excel file and logs loads per session. UI in Italian, code and comments in English, no backend: everything is stored in IndexedDB on the device.

## Stack

React 18 + TypeScript + Vite. Only runtime dependency is `fflate` (unzip of the xlsx). No router, no state library, no UI kit.

## Commands

| Command | What it does |
| - | - |
| `npm run dev` | dev server on 5173 |
| `npm run build` | typecheck plus production build in `dist` |
| `npm run preview` | serves `dist` |
| `node scripts/parse-check.mjs "file.xlsx"` | prints what the parser reads from a workbook |
| `python scripts/make-icons.py` | regenerates the PWA icons in `public` |

`#/anim` renders a gallery of every animation, dev build only.

## Structure

```
src/
  App.tsx              shell, topbar, tab bar, route switch
  main.tsx             mount plus service worker registration
  types.ts             Scheda, Day, Exercise, Session, SetLog, Settings
  lib/
    xlsx.ts            minimal xlsx reader: cells, column widths, pictures with their anchors
    parser.ts          workbook to Scheda, pairs pictures to exercise columns
    scheme.ts          "3x12", "10 min", "3x30secx30sec" parsing and formatting
    exerciseMeta.ts    name to movement pattern plus muscles, ordered regex rules
    db.ts              IndexedDB stores: schede, sessions, images, kv
    store.tsx          AppProvider and useApp, all state and persistence
    stats.ts           volume, records, 1RM, history by exercise name, weekly aggregates
    router.ts          hash router (keeps the Android back button working)
    format.ts          Italian dates and numbers
    feedback.ts        beeps, vibration, wake lock
  components/          ExerciseAnimation (+ animation.css), ExerciseMedia, Chart, Sheet, icons
  views/               HomeView, DayView, WorkoutView, ExerciseDetail, HistoryView, StatsView, SettingsView, ImportView
public/                manifest, icons, sw.js, scheda-2.xlsx (seed loaded on first launch)
```

## Rules that matter here

- Sessions key their history on the **exercise name**, not the id: re-importing a scheda must not lose past loads. Same for days, matched on the title.
- A session counts as training done as soon as one set is ticked (`isTracked` in `stats.ts`), whether it was closed or not. History, home and stats all filter with it, never with `done` alone. Sessions with nothing ticked are dropped instead of leaving empty rows.
- An open session is closed, never deleted: on launch when older than `STALE_SESSION_MS`, and when another workout is started. `updatedAt` is written on every save and doubles as `endedAt` for auto closed sessions.
- Import is two steps: `prepareImport` parses and looks for a scheda that the file updates (same source file or same name), `commitImport` writes it as a new plan or over the existing one. Replacing keeps id, name and the exercises marked `custom`, closes sessions open on that scheda and prunes the pictures nobody points at.
- Picture ids are prefixed per import: media paths repeat across workbooks, without the prefix a second scheda would overwrite the pictures of the first.
- The parser must stay tolerant: unknown layouts return warnings, never a crash. Every value it guesses (name, sets, note, picture) is editable in the UI.
- Pictures are paired with the column the drawing is centred on, computed from the column widths in EMU. One column, one picture, first come first served.
- Only one session can be open at a time, and it is written to IndexedDB on every change so a reload resumes it.
- Adding a movement: a rule in `exerciseMeta.ts`, a drawing in `ExerciseAnimation.tsx`, its keyframes in `animation.css`.
- The app must keep working with no network: no external fonts, no CDN, no API.

## Deploy

Push on `main` triggers `.github/workflows/deploy.yml` which builds and publishes to GitHub Pages. `base: './'` in `vite.config.ts` is what makes the subpath work, do not set an absolute base.

## Android (Capacitor), not set up yet

```bash
npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android
npx cap init "Scheda Palestra" com.ricknewere.schedapalestra --web-dir=dist
npm run build && npx cap add android && npx cap open android
```

Needs Android Studio and a JDK. The wake lock, vibration and audio used during a workout are standard web APIs and work inside the WebView.
