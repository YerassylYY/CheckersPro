import { Clock } from 'lucide-react'
import type { PlayerId } from '../../game/types'

interface BlitzClockProps {
  p1Display: string
  p2Display: string
  activePlayer: PlayerId | null
  urgentPlayer?: PlayerId | null
  p1Label?: string
  p2Label?: string
}

export function BlitzClock({
  p1Display,
  p2Display,
  activePlayer,
  urgentPlayer,
  p1Label = 'White',
  p2Label = 'Black',
}: BlitzClockProps) {
  return (
    <div className="flex w-full max-w-md items-stretch justify-between gap-2 px-2">
      <ClockCard
        label={p1Label}
        time={p1Display}
        active={activePlayer === 1}
        urgent={urgentPlayer === 1}
        side="white"
      />
      <div className="flex flex-col items-center justify-center px-1 text-zinc-500">
        <Clock size={14} strokeWidth={2} />
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">
          3:00
        </span>
      </div>
      <ClockCard
        label={p2Label}
        time={p2Display}
        active={activePlayer === 2}
        urgent={urgentPlayer === 2}
        side="black"
      />
    </div>
  )
}

function ClockCard({
  label,
  time,
  active,
  urgent,
  side,
}: {
  label: string
  time: string
  active: boolean
  urgent?: boolean
  side: 'white' | 'black'
}) {
  return (
    <div
      className={[
        'min-w-[96px] flex-1 rounded-lg border px-3 py-2 text-center transition-all duration-150',
        active
          ? side === 'white'
            ? 'border-amber-500/80 bg-zinc-800'
            : 'border-zinc-500 bg-zinc-800'
          : 'border-zinc-800 bg-zinc-900',
        urgent && 'animate-clock-urgent border-rose-600/80 bg-rose-950/40',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center justify-center gap-1.5">
        <span
          className={`h-2.5 w-2.5 rounded-full border border-black/20 ${
            side === 'white' ? 'bg-stone-100' : 'bg-zinc-700'
          }`}
        />
        <span className="text-xs font-medium text-zinc-400">{label}</span>
      </div>
      <div
        className={`mt-0.5 font-mono text-2xl font-bold tabular-nums ${
          urgent ? 'text-rose-300' : active ? 'text-white' : 'text-zinc-400'
        }`}
      >
        {time}
      </div>
    </div>
  )
}
