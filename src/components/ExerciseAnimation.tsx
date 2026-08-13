/**
 * Looping SVG animations, one per movement pattern.
 * They are drawn as line art so they stay readable at thumbnail size and
 * follow the theme colours.
 */
import './animation.css'

interface Props {
  pattern: string
  className?: string
}

const ALIAS: Record<string, string> = {
  squat: 'lunge',
  pushUp: 'benchPress',
  row: 'cableRow',
  backExtension: 'deadlift',
  shrug: 'lateralRaise',
  stairs: 'run',
  treadmill: 'run',
  cardioGeneric: 'run',
  plank: 'hold',
}

const V = '0 0 160 120'
const GROUND = 104

function Ground() {
  return <line className="an-ground" x1="8" y1={GROUND} x2="152" y2={GROUND} />
}

function Head({ x, y, r = 7 }: { x: number; y: number; r?: number }) {
  return <circle className="an-body" cx={x} cy={y} r={r} />
}

function Bar({ x, y, w = 34 }: { x: number; y: number; w?: number }) {
  return (
    <g className="an-load">
      <line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} />
      <circle cx={x - w / 2} cy={y} r="4.5" />
      <circle cx={x + w / 2} cy={y} r="4.5" />
    </g>
  )
}

function Dumbbell({ x, y, size = 7 }: { x: number; y: number; size?: number }) {
  return (
    <g className="an-load">
      <line x1={x - size} y1={y} x2={x + size} y2={y} />
      <line x1={x - size} y1={y - 4} x2={x - size} y2={y + 4} />
      <line x1={x + size} y1={y - 4} x2={x + size} y2={y + 4} />
    </g>
  )
}

function seatedKnee(reverse: boolean) {
  return (
    <>
      <Ground />
      {/* machine */}
      <g className="an-frame">
        <line x1="46" y1="78" x2="46" y2={GROUND} />
        <line x1="46" y1="78" x2="96" y2="78" />
        <line x1="44" y1="78" x2="36" y2="46" />
        <line x1="112" y1="52" x2="112" y2={GROUND} />
        <line x1="104" y1="56" x2="120" y2="56" />
      </g>
      {/* seated body */}
      <g className="an-body">
        <line x1="52" y1="74" x2="44" y2="50" />
        <line x1="52" y1="74" x2="92" y2="74" />
      </g>
      <Head x={42} y={42} />
      <g className={reverse ? 'an-knee-rev' : 'an-knee'} style={{ transformOrigin: '92px 74px' }}>
        <line className="an-body" x1="92" y1="74" x2="92" y2="98" />
        <line className="an-accent" x1="92" y1="98" x2="104" y2="98" />
        <g className="an-load">
          <line x1="86" y1="94" x2="98" y2="94" />
        </g>
      </g>
    </>
  )
}

function drawing(pattern: string) {
  switch (pattern) {
    case 'legExtension':
      return seatedKnee(false)
    case 'legCurl':
      return seatedKnee(true)

    case 'legPress':
      return (
        <>
          <Ground />
          <g className="an-frame">
            <line x1="20" y1="60" x2="20" y2={GROUND} />
            <line x1="20" y1="88" x2="58" y2="96" />
          </g>
          <g className="an-body">
            <line x1="58" y1="96" x2="44" y2="76" />
          </g>
          <Head x={40} y={70} />
          <g className="an-press-sled" style={{ transformOrigin: '110px 70px' }}>
            <line className="an-accent" x1="112" y1="60" x2="112" y2="88" />
            <g className="an-load">
              <line x1="118" y1="56" x2="118" y2="92" />
              <line x1="126" y1="58" x2="126" y2="90" />
            </g>
          </g>
          <g className="an-press-leg">
            <line className="an-body" x1="58" y1="94" x2="86" y2="78" />
            <line className="an-body" x1="86" y1="78" x2="110" y2="74" />
          </g>
        </>
      )

    case 'hipThrust':
      return (
        <>
          <Ground />
          <g className="an-frame">
            <line x1="26" y1="70" x2="76" y2="70" />
            <line x1="30" y1="70" x2="30" y2={GROUND} />
            <line x1="72" y1="70" x2="72" y2={GROUND} />
          </g>
          <g className="an-hip" style={{ transformOrigin: '52px 68px' }}>
            <line className="an-body" x1="52" y1="68" x2="98" y2="76" />
            <g className="an-accent">
              <circle cx="98" cy="78" r="5" />
            </g>
            <g className="an-load">
              <line x1="90" y1="66" x2="106" y2="66" />
              <circle cx="90" cy="66" r="4" />
              <circle cx="106" cy="66" r="4" />
            </g>
          </g>
          <g className="an-body">
            <line x1="98" y1="80" x2="112" y2={GROUND} />
            <line x1="112" y1={GROUND} x2="126" y2={GROUND} />
          </g>
          <Head x={40} y={62} />
        </>
      )

    case 'deadlift':
      return (
        <>
          <Ground />
          <g className="an-hinge" style={{ transformOrigin: '84px 62px' }}>
            <line className="an-body" x1="84" y1="62" x2="72" y2="34" />
            <circle className="an-body an-fill" cx="70" cy="27" r="7" />
            <line className="an-accent" x1="76" y1="40" x2="88" y2="66" />
          </g>
          <g className="an-body">
            <line x1="84" y1="62" x2="86" y2={GROUND} />
            <line x1="78" y1={GROUND} x2="96" y2={GROUND} />
          </g>
          <g className="an-hinge-bar">
            <Bar x={88} y={72} />
          </g>
        </>
      )

    case 'calfRaise':
      return (
        <>
          <Ground />
          <g className="an-calf">
            <g className="an-body">
              <line x1="80" y1="40" x2="80" y2="72" />
              <line x1="80" y1="72" x2="80" y2="96" />
              <line x1="80" y1="52" x2="62" y2="62" />
              <line x1="80" y1="52" x2="98" y2="62" />
            </g>
            <Head x={80} y={32} />
            <line className="an-accent" x1="80" y1="82" x2="80" y2="96" />
          </g>
          <g className="an-frame">
            <line x1="60" y1="96" x2="100" y2="96" />
          </g>
        </>
      )

    case 'lunge':
      return (
        <>
          <Ground />
          <g className="an-lunge">
            <g className="an-body">
              <line x1="80" y1="36" x2="80" y2="64" />
              <line x1="80" y1="64" x2="60" y2="88" />
              <line x1="60" y1="88" x2="60" y2={GROUND} />
              <line x1="80" y1="64" x2="102" y2="86" />
              <line x1="102" y1="86" x2="102" y2={GROUND} />
              <line x1="80" y1="44" x2="66" y2="66" />
              <line x1="80" y1="44" x2="94" y2="66" />
            </g>
            <Head x={80} y={28} />
            <Dumbbell x={64} y={70} size={6} />
            <Dumbbell x={96} y={70} size={6} />
          </g>
        </>
      )

    case 'pushUp':
      return (
        <>
          <Ground />
          <g className="an-pushup" style={{ transformOrigin: '124px 98px' }}>
            <g className="an-body">
              <line x1="52" y1="70" x2="124" y2="92" />
              <line x1="124" y1="92" x2="134" y2="98" />
            </g>
            <Head x={46} y={68} />
            <line className="an-accent" x1="58" y1="72" x2="60" y2="98" />
            <line className="an-accent" x1="86" y1="80" x2="84" y2="98" />
          </g>
          <line className="an-frame" x1="30" y1="98" x2="140" y2="98" />
        </>
      )

    case 'adduction':
      return (
        <>
          <Ground />
          <g className="an-frame">
            <line x1="70" y1="46" x2="70" y2="78" />
            <line x1="56" y1="78" x2="104" y2="78" />
          </g>
          <Head x={70} y={38} />
          <g className="an-add-left" style={{ transformOrigin: '70px 78px' }}>
            <line className="an-accent" x1="70" y1="78" x2="46" y2="98" />
          </g>
          <g className="an-add-right" style={{ transformOrigin: '70px 78px' }}>
            <line className="an-accent" x1="70" y1="78" x2="94" y2="98" />
          </g>
        </>
      )

    case 'cableRow':
      return (
        <>
          <Ground />
          <g className="an-frame">
            <line x1="132" y1="26" x2="132" y2={GROUND} />
            <line x1="124" y1="30" x2="140" y2="30" />
            <line x1="18" y1="96" x2="70" y2="96" />
          </g>
          <g className="an-body">
            <line x1="52" y1="90" x2="52" y2="58" />
            <line x1="52" y1="90" x2="86" y2="94" />
            <line x1="86" y1="94" x2="98" y2="80" />
          </g>
          <Head x={52} y={50} />
          <g className="an-row-arm">
            <line className="an-accent" x1="52" y1="62" x2="92" y2="66" />
            <line className="an-cable" x1="92" y1="66" x2="132" y2="46" />
            <circle className="an-load an-fill" cx="92" cy="66" r="4" />
          </g>
        </>
      )

    case 'pulldown':
      return (
        <>
          <Ground />
          <g className="an-frame">
            <line x1="30" y1="18" x2="130" y2="18" />
            <line x1="30" y1="18" x2="30" y2={GROUND} />
          </g>
          <g className="an-body">
            <line x1="80" y1="52" x2="80" y2="84" />
            <line x1="80" y1="84" x2="66" y2="98" />
            <line x1="80" y1="84" x2="96" y2="98" />
          </g>
          <Head x={80} y={44} />
          <g className="an-pulldown">
            <line className="an-accent" x1="80" y1="56" x2="62" y2="32" />
            <line className="an-accent" x1="80" y1="56" x2="98" y2="32" />
            <line className="an-load" x1="58" y1="30" x2="102" y2="30" />
            <line className="an-cable" x1="80" y1="30" x2="80" y2="18" />
          </g>
        </>
      )

    case 'fly':
      return (
        <>
          <Ground />
          <g className="an-frame">
            <line x1="40" y1="82" x2="120" y2="82" />
            <line x1="50" y1="82" x2="50" y2={GROUND} />
            <line x1="110" y1="82" x2="110" y2={GROUND} />
          </g>
          <g className="an-body">
            <line x1="52" y1="78" x2="112" y2="78" />
          </g>
          <Head x={46} y={72} />
          <g className="an-fly-left" style={{ transformOrigin: '76px 78px' }}>
            <line className="an-accent" x1="76" y1="78" x2="52" y2="48" />
            <g className="an-load">
              <line x1="46" y1="48" x2="58" y2="42" />
            </g>
          </g>
          <g className="an-fly-right" style={{ transformOrigin: '76px 78px' }}>
            <line className="an-accent" x1="76" y1="78" x2="100" y2="48" />
            <g className="an-load">
              <line x1="94" y1="42" x2="106" y2="48" />
            </g>
          </g>
        </>
      )

    case 'benchPress':
      return (
        <>
          <Ground />
          <g className="an-frame">
            <line x1="40" y1="82" x2="120" y2="82" />
            <line x1="50" y1="82" x2="50" y2={GROUND} />
            <line x1="110" y1="82" x2="110" y2={GROUND} />
          </g>
          <g className="an-body">
            <line x1="52" y1="78" x2="112" y2="78" />
            <line x1="112" y1="78" x2="124" y2="96" />
          </g>
          <Head x={46} y={72} />
          <g className="an-bench-press">
            <line className="an-accent" x1="66" y1="76" x2="66" y2="52" />
            <line className="an-accent" x1="86" y1="76" x2="86" y2="52" />
            <Bar x={76} y={50} />
          </g>
        </>
      )

    case 'lateralRaise':
      return (
        <>
          <Ground />
          <g className="an-body">
            <line x1="80" y1="42" x2="80" y2="76" />
            <line x1="80" y1="76" x2="70" y2={GROUND} />
            <line x1="80" y1="76" x2="90" y2={GROUND} />
          </g>
          <Head x={80} y={34} />
          <g className="an-raise-left" style={{ transformOrigin: '80px 48px' }}>
            <line className="an-accent" x1="80" y1="48" x2="52" y2="66" />
            <g className="an-load">
              <line x1="46" y1="62" x2="58" y2="70" />
            </g>
          </g>
          <g className="an-raise-right" style={{ transformOrigin: '80px 48px' }}>
            <line className="an-accent" x1="80" y1="48" x2="108" y2="66" />
            <g className="an-load">
              <line x1="102" y1="70" x2="114" y2="62" />
            </g>
          </g>
        </>
      )

    case 'shoulderPress':
      return (
        <>
          <Ground />
          <g className="an-body">
            <line x1="80" y1="44" x2="80" y2="78" />
            <line x1="80" y1="78" x2="70" y2={GROUND} />
            <line x1="80" y1="78" x2="90" y2={GROUND} />
          </g>
          <Head x={80} y={36} />
          <g className="an-overhead">
            <line className="an-accent" x1="80" y1="50" x2="60" y2="36" />
            <line className="an-accent" x1="80" y1="50" x2="100" y2="36" />
            <Dumbbell x={56} y={34} size={6} />
            <Dumbbell x={104} y={34} size={6} />
          </g>
        </>
      )

    case 'curl':
      return (
        <>
          <Ground />
          <g className="an-frame">
            <line x1="52" y1="84" x2="104" y2="84" />
            <line x1="58" y1="84" x2="58" y2={GROUND} />
            <line x1="98" y1="84" x2="98" y2={GROUND} />
          </g>
          <g className="an-body">
            <line x1="76" y1="46" x2="76" y2="80" />
            <line x1="76" y1="80" x2="100" y2="92" />
          </g>
          <Head x={76} y={38} />
          <line className="an-body" x1="76" y1="52" x2="72" y2="70" />
          <g className="an-curl" style={{ transformOrigin: '72px 70px' }}>
            <line className="an-accent" x1="72" y1="70" x2="94" y2="76" />
            <Dumbbell x={98} y={77} size={6} />
          </g>
        </>
      )

    case 'pushdown':
      return (
        <>
          <Ground />
          <g className="an-frame">
            <line x1="122" y1="18" x2="122" y2={GROUND} />
            <line x1="114" y1="22" x2="130" y2="22" />
          </g>
          <g className="an-body">
            <line x1="70" y1="46" x2="72" y2="80" />
            <line x1="72" y1="80" x2="62" y2={GROUND} />
            <line x1="72" y1="80" x2="82" y2={GROUND} />
            <line x1="70" y1="52" x2="88" y2="58" />
          </g>
          <Head x={68} y={38} />
          <g className="an-pushdown" style={{ transformOrigin: '88px 58px' }}>
            <line className="an-accent" x1="88" y1="58" x2="96" y2="76" />
            <line className="an-load" x1="90" y1="78" x2="104" y2="78" />
          </g>
          <line className="an-cable" x1="96" y1="58" x2="122" y2="24" />
        </>
      )

    case 'crunch':
      return (
        <>
          <Ground />
          <g className="an-body">
            <line x1="112" y1="96" x2="92" y2="76" />
            <line x1="92" y1="76" x2="74" y2="96" />
          </g>
          <g className="an-crunch" style={{ transformOrigin: '74px 96px' }}>
            <line className="an-accent" x1="74" y1="96" x2="48" y2="92" />
            <circle className="an-body an-fill" cx="42" cy="90" r="7" />
          </g>
          <line className="an-ground" x1="30" y1="98" x2="130" y2="98" />
        </>
      )

    case 'run':
      return (
        <>
          <g className="an-frame">
            <line x1="24" y1="98" x2="136" y2="98" />
            <line x1="24" y1="98" x2="24" y2={GROUND} />
            <line x1="136" y1="98" x2="136" y2={GROUND} />
          </g>
          <g className="an-runner">
            <Head x={80} y={32} />
            <line className="an-body" x1="80" y1="40" x2="78" y2="68" />
            <g className="an-run-armA" style={{ transformOrigin: '79px 48px' }}>
              <line className="an-accent" x1="79" y1="48" x2="72" y2="62" />
            </g>
            <g className="an-run-armB" style={{ transformOrigin: '79px 48px' }}>
              <line className="an-accent" x1="79" y1="48" x2="87" y2="62" />
            </g>
            <g className="an-run-legA" style={{ transformOrigin: '78px 68px' }}>
              <line className="an-body" x1="78" y1="68" x2="72" y2="94" />
            </g>
            <g className="an-run-legB" style={{ transformOrigin: '78px 68px' }}>
              <line className="an-body" x1="78" y1="68" x2="84" y2="94" />
            </g>
          </g>
        </>
      )

    case 'rowErg':
      return (
        <>
          <Ground />
          <g className="an-frame">
            <line x1="24" y1="94" x2="136" y2="94" />
            <line x1="30" y1="60" x2="30" y2="94" />
            <line x1="22" y1="62" x2="38" y2="62" />
          </g>
          <g className="an-erg-body">
            <Head x={92} y={54} />
            <line className="an-body" x1="92" y1="62" x2="94" y2="84" />
            <line className="an-body" x1="94" y1="84" x2="72" y2="88" />
            <line className="an-accent" x1="92" y1="66" x2="64" y2="70" />
            <line className="an-cable" x1="64" y1="70" x2="30" y2="66" />
          </g>
        </>
      )

    case 'bike':
      return (
        <>
          <Ground />
          <g className="an-frame">
            <circle cx="70" cy="86" r="14" />
            <line x1="70" y1="86" x2="86" y2="56" />
            <line x1="86" y1="56" x2="96" y2="60" />
          </g>
          <g className="an-body">
            <line x1="88" y1="52" x2="94" y2="74" />
          </g>
          <Head x={86} y={44} />
          <g className="an-pedal" style={{ transformOrigin: '70px 86px' }}>
            <line className="an-accent" x1="70" y1="86" x2="70" y2="98" />
          </g>
          <g className="an-pedal-rev" style={{ transformOrigin: '70px 86px' }}>
            <line className="an-accent" x1="70" y1="86" x2="70" y2="74" />
          </g>
        </>
      )

    case 'hold':
      return (
        <>
          <line className="an-frame" x1="24" y1="98" x2="140" y2="98" />
          <g className="an-hold">
            <Head x={46} y={70} />
            <line className="an-body" x1="54" y1="74" x2="112" y2="90" />
            <line className="an-accent" x1="58" y1="76" x2="56" y2="96" />
            <line className="an-accent" x1="58" y1="96" x2="70" y2="96" />
            <line className="an-body" x1="112" y1="90" x2="124" y2="96" />
          </g>
        </>
      )

    case 'stretch':
      return (
        <>
          <Ground />
          <g className="an-stretch" style={{ transformOrigin: '80px 70px' }}>
            <line className="an-body" x1="80" y1="70" x2="80" y2="42" />
            <circle className="an-body an-fill" cx="80" cy="35" r="7" />
            <line className="an-accent" x1="80" y1="48" x2="86" y2="72" />
          </g>
          <g className="an-body">
            <line x1="80" y1="70" x2="78" y2={GROUND} />
            <line x1="70" y1={GROUND} x2="88" y2={GROUND} />
          </g>
        </>
      )

    case 'balance':
      return (
        <>
          <Ground />
          <g className="an-balance">
            <Head x={80} y={32} />
            <line className="an-body" x1="80" y1="40" x2="80" y2="70" />
            <line className="an-accent" x1="80" y1="46" x2="60" y2="56" />
            <line className="an-accent" x1="80" y1="46" x2="100" y2="56" />
            <line className="an-body" x1="80" y1="70" x2="79" y2={GROUND} />
            <line className="an-accent" x1="80" y1="70" x2="96" y2="76" />
            <line className="an-accent" x1="96" y1="76" x2="94" y2="90" />
          </g>
        </>
      )

    default:
      return (
        <>
          <Ground />
          <g className="an-generic">
            <Dumbbell x={80} y={66} size={16} />
          </g>
        </>
      )
  }
}

export default function ExerciseAnimation({ pattern, className }: Props) {
  const key = ALIAS[pattern] || pattern
  return (
    <svg className={`an-svg ${className || ''}`} viewBox={V} role="img" aria-label={`Animazione ${pattern}`}>
      {drawing(key)}
    </svg>
  )
}
