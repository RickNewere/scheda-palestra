/** Small line chart for load progression. */
import { shortDate } from '../lib/format'

interface Point {
  date: number
  value: number
}

interface Props {
  points: Point[]
  unit?: string
}

export default function Chart({ points, unit = 'kg' }: Props) {
  if (points.length < 2) return null
  const w = 300
  const h = 130
  const padX = 10
  const padTop = 14
  const padBottom = 22

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || Math.max(1, max * 0.1)
  const lo = min - span * 0.2
  const hi = max + span * 0.2

  const x = (i: number) => padX + (i * (w - padX * 2)) / (points.length - 1)
  const y = (v: number) => padTop + (1 - (v - lo) / (hi - lo)) * (h - padTop - padBottom)

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${path} L${x(points.length - 1).toFixed(1)},${h - padBottom} L${padX},${h - padBottom} Z`
  const labelEvery = Math.ceil(points.length / 5)

  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line className="grid" x1={padX} y1={padTop} x2={w - padX} y2={padTop} />
      <line className="grid" x1={padX} y1={(h - padBottom + padTop) / 2} x2={w - padX} y2={(h - padBottom + padTop) / 2} />
      <line className="grid" x1={padX} y1={h - padBottom} x2={w - padX} y2={h - padBottom} />
      <path className="area" d={area} />
      <path className="line" d={path} />
      {points.map((p, i) => (
        <circle key={p.date + '-' + i} className="dot" cx={x(i)} cy={y(p.value)} r={i === points.length - 1 ? 4 : 2.6} />
      ))}
      {points.map((p, i) =>
        i % labelEvery === 0 || i === points.length - 1 ? (
          <text key={`l${p.date}-${i}`} x={x(i)} y={h - 6} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>
            {shortDate(p.date)}
          </text>
        ) : null,
      )}
      <text x={w - padX} y={padTop - 4} textAnchor="end">
        max {Math.round(max)} {unit}
      </text>
    </svg>
  )
}
