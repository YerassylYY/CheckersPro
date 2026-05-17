import type { EvalPoint } from '../../../game/analyzer'

interface AdvantageChartProps {
  points: EvalPoint[]
  selectedPly: number
  onSelectPly: (ply: number) => void
}

export function AdvantageChart({
  points,
  selectedPly,
  onSelectPly,
}: AdvantageChartProps) {
  if (points.length < 2) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        Not enough data for evaluation graph.
      </p>
    )
  }

  const width = 640
  const height = 220
  const pad = { top: 20, right: 16, bottom: 28, left: 44 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const evals = points.map((p) => p.eval)
  const maxAbs = Math.max(300, ...evals.map((e) => Math.abs(e)), 1)
  const yScale = (v: number) =>
    pad.top + innerH / 2 - (v / maxAbs) * (innerH / 2)

  const xScale = (i: number) =>
    pad.left + (i / Math.max(1, points.length - 1)) * innerW

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.eval)}`)
    .join(' ')

  const areaPath = `${linePath} L ${xScale(points.length - 1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`

  const zeroY = yScale(0)

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[320px]"
        role="img"
        aria-label="Advantage over time"
      >
        <line
          x1={pad.left}
          y1={zeroY}
          x2={width - pad.right}
          y2={zeroY}
          stroke="#52525b"
          strokeDasharray="4 4"
        />
        <text x={8} y={pad.top + 4} className="fill-zinc-500 text-[10px]">
          White +
        </text>
        <text x={8} y={height - 8} className="fill-zinc-500 text-[10px]">
          Black +
        </text>
        <path d={areaPath} fill="url(#evalGrad)" opacity={0.35} />
        <path d={linePath} fill="none" stroke="#34d399" strokeWidth={2} />
        <defs>
          <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#71717a" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>
        {points.map((p, i) => (
          <g key={p.plyIndex}>
            <circle
              cx={xScale(i)}
              cy={yScale(p.eval)}
              r={selectedPly === p.plyIndex ? 6 : 3}
              className={
                selectedPly === p.plyIndex
                  ? 'fill-amber-400 stroke-zinc-900'
                  : 'fill-emerald-400'
              }
              strokeWidth={2}
              onClick={() => onSelectPly(p.plyIndex)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
