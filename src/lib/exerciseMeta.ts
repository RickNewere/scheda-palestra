/**
 * Maps an exercise name to a movement pattern (used for the animation) and to
 * the muscles it works. Rules are ordered: the first match wins, so more
 * specific rules come first.
 */
export interface Meta {
  pattern: string
  muscles: string[]
  cardio?: boolean
}

interface Rule extends Meta {
  test: RegExp
}

const RULES: Rule[] = [
  // Cardio machines come first, "rematore" is both a machine and a back exercise
  { test: /cardio.*(tapis|tapiroulant|corsa|running|treadmill)|tapis|treadmill/i, pattern: 'treadmill', muscles: ['Cardio'], cardio: true },
  { test: /cardio.*(scalin|step|stair)|scalin|stepper|stair/i, pattern: 'stairs', muscles: ['Cardio', 'Gambe'], cardio: true },
  { test: /cardio.*(remator|vogator|rower)|vogator|rower/i, pattern: 'rowErg', muscles: ['Cardio', 'Full body'], cardio: true },
  { test: /cardio.*(bike|cyclette|bici|spin)|cyclette|ellittica|elliptical/i, pattern: 'bike', muscles: ['Cardio', 'Gambe'], cardio: true },
  { test: /^cardio\b|corda|jumping jack|salto/i, pattern: 'cardioGeneric', muscles: ['Cardio'], cardio: true },

  // Legs
  { test: /leg\s*curl.*(quadricip|estension)|leg\s*extension|estensioni gambe/i, pattern: 'legExtension', muscles: ['Quadricipiti'] },
  { test: /leg\s*curl|femoral|hamstring/i, pattern: 'legCurl', muscles: ['Femorali'] },
  { test: /calf|polpacc/i, pattern: 'calfRaise', muscles: ['Polpacci'] },
  { test: /leg\s*press|pressa/i, pattern: 'legPress', muscles: ['Quadricipiti', 'Glutei'] },
  { test: /hip\s*(trust|thrust)|ponte glutei|glute bridge/i, pattern: 'hipThrust', muscles: ['Glutei', 'Femorali'] },
  { test: /stacco|deadlift|rumeno|romanian/i, pattern: 'deadlift', muscles: ['Femorali', 'Glutei', 'Dorsali'] },
  { test: /affond|lunge|discesa con manubri|bulgar|split squat/i, pattern: 'lunge', muscles: ['Quadricipiti', 'Glutei'] },
  { test: /squat|accosciata/i, pattern: 'squat', muscles: ['Quadricipiti', 'Glutei'] },
  { test: /adduttor|abduttor/i, pattern: 'adduction', muscles: ['Adduttori', 'Glutei'] },

  // Back
  { test: /pulley|rematore.*(cavo|macchin|basso)|seated row/i, pattern: 'cableRow', muscles: ['Dorsali', 'Bicipiti'] },
  { test: /lat\s*machine|pulldown|trazioni|pull\s*up|trazione/i, pattern: 'pulldown', muscles: ['Dorsali', 'Bicipiti'] },
  { test: /remator|row\b|pendlay/i, pattern: 'row', muscles: ['Dorsali', 'Bicipiti'] },
  { test: /iperestension|hyperexten|lombar/i, pattern: 'backExtension', muscles: ['Lombari', 'Glutei'] },

  // Chest
  { test: /croci|fly|pectoral|peck deck/i, pattern: 'fly', muscles: ['Petto'] },
  { test: /panca piana|bench press|panca inclinata|chest press|spinte panca/i, pattern: 'benchPress', muscles: ['Petto', 'Tricipiti'] },
  { test: /piegament|push\s*up|flession/i, pattern: 'pushUp', muscles: ['Petto', 'Tricipiti'] },

  // Shoulders
  { test: /alzate laterali|lateral raise|alzate/i, pattern: 'lateralRaise', muscles: ['Spalle'] },
  { test: /spinte|shoulder press|military|lento avanti|arnold/i, pattern: 'shoulderPress', muscles: ['Spalle', 'Tricipiti'] },
  { test: /tirate al mento|upright row|scrollate|shrug/i, pattern: 'shrug', muscles: ['Trapezi', 'Spalle'] },

  // Arms
  { test: /hammer|curl|bicip/i, pattern: 'curl', muscles: ['Bicipiti'] },
  { test: /pushdown|push down|french|tricip|dip|kickback/i, pattern: 'pushdown', muscles: ['Tricipiti'] },

  // Core, balance, mobility
  { test: /plank|core/i, pattern: 'plank', muscles: ['Core'] },
  { test: /crunch|addominal|sit\s*up|russian twist/i, pattern: 'crunch', muscles: ['Addominali'] },
  { test: /equilibri|balance|propriocett|caviglia/i, pattern: 'balance', muscles: ['Equilibrio', 'Core'] },
  { test: /stretch|streatch|allungament|mobilit/i, pattern: 'stretch', muscles: ['Mobilità'] },
  { test: /risc|warm\s*up|riscaldament/i, pattern: 'cardioGeneric', muscles: ['Riscaldamento'] },
]

export function metaFor(name: string): Meta {
  const clean = name.trim()
  for (const rule of RULES) {
    if (rule.test.test(clean)) {
      return { pattern: rule.pattern, muscles: rule.muscles, cardio: rule.cardio }
    }
  }
  return { pattern: 'generic', muscles: [] }
}

/** Colour token per muscle, used for chips and stats. */
export const MUSCLE_COLORS: Record<string, string> = {
  Quadricipiti: '#f97316',
  Femorali: '#f59e0b',
  Glutei: '#ef4444',
  Polpacci: '#eab308',
  Adduttori: '#fb7185',
  Petto: '#ec4899',
  Dorsali: '#6366f1',
  Lombari: '#818cf8',
  Spalle: '#06b6d4',
  Trapezi: '#0ea5e9',
  Bicipiti: '#22c55e',
  Tricipiti: '#14b8a6',
  Addominali: '#a855f7',
  Core: '#8b5cf6',
  Cardio: '#f43f5e',
  'Full body': '#94a3b8',
  Gambe: '#f97316',
  Equilibrio: '#38bdf8',
  Mobilità: '#2dd4bf',
  Riscaldamento: '#94a3b8',
}

export function muscleColor(m: string): string {
  return MUSCLE_COLORS[m] || '#64748b'
}
