# Scheda Palestra

Workout app that reads your gym plan straight from an Excel file and lets you log your loads set by set, day by day. It works offline, installs on the phone as an app and keeps every piece of data on the device.

Live app: https://ricknewere.github.io/scheda-palestra/

## What it does

**Reads your Excel plan**
Drop in the `.xlsx` of your scheda and the app builds the workout for you: training days, exercise names, sets and reps, rest time and the notes written next to each exercise. Even the pictures pasted into the sheet are extracted and matched to the exercise they belong to.

**Shows what to do today**
The home screen suggests the day you have trained least recently, shows how many sessions and how much volume you did this week and lets you jump straight into any day.

**Every exercise, illustrated**
Each exercise shows the picture taken from your file plus a drawn animation of the movement, so you always see how the exercise goes. Muscles worked, target sets and reps and the note from the sheet are right there.

**Workout mode**
One exercise at a time, with weight and reps entered through big steppers. Tick a set and the rest timer starts on its own with a beep and a vibration when it is over. Timed work like `10 min` cardio or `3x30sec` gets a countdown instead of reps. The loads of your last session are prefilled, so you always know what to beat.

**Nothing gets lost**
A set counts the moment you tick it. Leave the workout, close the app or start another day and what you logged is already in your history, marked as still open so you can pick it up later. A session left open is closed on its own after a few hours.

**Progress**
History with loads and volume, personal records, estimated 1RM, load progression charts per exercise, weekly volume and how your sets are spread across muscle groups.

**Multiple schede**
Import as many plans as you like and switch between them from the home screen. Importing a file that matches a plan you already have offers to update it: the days are rebuilt from the new file while history, records and the exercises you added by hand stay where they are. History follows the exercise name, so past loads survive any update. You can also rename exercises, change sets and reps, reorder them or add exercises that are not in the file.

**Yours only**
No account, no server. Everything lives in the browser storage of your device and you can export a full backup to a file whenever you want.

## Install on the phone

Open the app link in Chrome or Safari, then use "Add to home screen". It runs full screen and works with no connection.

## Run it locally

```bash
npm install
npm run dev
```

Then open the address printed in the terminal. To build the production files use `npm run build`.

## Excel format

Any file laid out like this works, and a sheet can hold as many days as you want:

| | C | D | E |
| - | - | - | - |
| 12 | Giorno 1 | | |
| 13 | Gambe + Upper | Leg press | Leg curl |
| 14 | Default | 3x12 | 3x12 |
| 25 | Recupero 3' | nota | nota |

- a cell containing `Giorno 1` opens the block
- the row below has the day title in the same column and the exercise names to its right
- the next row holds the sets: `3x12`, `10 min`, `3x30sec`, `3x12x12` for work per side
- a `Recupero 3'` row sets the rest timer, and the cells to its right become notes on each exercise
- pictures are matched to the column they sit on

To check a new file before importing it: `node scripts/parse-check.mjs "my-scheda.xlsx"`.

## Android app

There is a real Android app, same code wrapped with Capacitor.

Download `scheda-palestra.apk` from the [latest release](https://github.com/RickNewere/scheda-palestra/releases/latest), open it on the phone and allow the install from unknown sources when Android asks. It works completely offline and keeps its own data, separate from the browser version.

To build it yourself:

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```

It needs JDK 21 and the Android SDK (platform 36). The APK comes out in `android/app/build/outputs/apk/release`.
