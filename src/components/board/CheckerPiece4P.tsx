import { Crown } from 'lucide-react'
import type { Cell4P, Player4Id } from '../../game/types'
import { getOwner4P, isKing4P } from '../../game/engine4p'

const PIECE_STYLES: Record<
  Player4Id,
  { base: string; crown: string; gloss: string }
> = {
  1: {
    base:
      'bg-stone-50 shadow-[inset_0_4px_6px_rgba(255,255,255,0.65),inset_0_-2px_4px_rgba(0,0,0,0.08)] border-b-4 border-stone-400',
    crown: 'fill-amber-500 text-amber-600',
    gloss: 'bg-white/50',
  },
  2: {
    base:
      'bg-zinc-800 shadow-[inset_0_2px_4px_rgba(255,255,255,0.12),inset_0_-3px_6px_rgba(0,0,0,0.55)] border-b-4 border-zinc-950',
    crown: 'fill-zinc-100 text-zinc-50',
    gloss: 'bg-white/10',
  },
  3: {
    base:
      'bg-red-800 shadow-[inset_0_3px_5px_rgba(255,120,120,0.25),inset_0_-3px_5px_rgba(0,0,0,0.45)] border-b-4 border-red-950',
    crown: 'fill-amber-400 text-amber-300',
    gloss: 'bg-white/15',
  },
  4: {
    base:
      'bg-blue-700 shadow-[inset_0_3px_5px_rgba(147,197,253,0.3),inset_0_-3px_5px_rgba(0,0,0,0.45)] border-b-4 border-blue-950',
    crown: 'fill-zinc-100 text-blue-100',
    gloss: 'bg-white/15',
  },
}

interface CheckerPiece4PProps {
  cell: Cell4P
  selected?: boolean
  highlight?: boolean
}

export function CheckerPiece4P({ cell, selected, highlight }: CheckerPiece4PProps) {
  const owner = getOwner4P(cell)
  if (!owner) return null

  const style = PIECE_STYLES[owner]
  const king = isKing4P(cell)

  return (
    <div
      className={[
        'relative flex h-[76%] w-[76%] min-h-[14px] min-w-[14px] max-h-8 max-w-8 items-center justify-center rounded-full border border-black/15 transition-transform duration-150 ease-out sm:max-h-9 sm:max-w-9',
        style.base,
        selected ? 'z-10 scale-105 ring-4 ring-amber-500/70' : '',
        highlight && !selected ? 'ring-2 ring-amber-400/50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      <span
        className={`pointer-events-none absolute left-1/2 top-[12%] h-[26%] w-[48%] -translate-x-1/2 rounded-full ${style.gloss}`}
      />
      {king && (
        <Crown
          size={12}
          strokeWidth={2.25}
          className={`relative z-10 ${style.crown}`}
        />
      )}
    </div>
  )
}
