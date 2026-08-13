/** Dev only preview of every animation, reachable at #/anim with `npm run dev`. */
import ExerciseAnimation from '../components/ExerciseAnimation'

const PATTERNS = [
  'legExtension',
  'legCurl',
  'legPress',
  'hipThrust',
  'deadlift',
  'calfRaise',
  'lunge',
  'squat',
  'adduction',
  'cableRow',
  'row',
  'pulldown',
  'fly',
  'benchPress',
  'pushUp',
  'lateralRaise',
  'shoulderPress',
  'curl',
  'pushdown',
  'crunch',
  'run',
  'treadmill',
  'stairs',
  'rowErg',
  'bike',
  'plank',
  'balance',
  'stretch',
  'generic',
]

export default function AnimationGallery() {
  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {PATTERNS.map((p) => (
          <div className="card col" key={p} style={{ gap: 6, padding: 8 }}>
            <div style={{ height: 110 }}>
              <ExerciseAnimation pattern={p} />
            </div>
            <span className="tiny muted" style={{ textAlign: 'center' }}>
              {p}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
