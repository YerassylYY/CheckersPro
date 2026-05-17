import { Crown } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { usePreferences } from '../../context/PreferencesContext'
import type { Cell } from '../../game/types'

interface CheckerPieceProps {
  cell: Cell
  selected?: boolean
  highlight?: boolean
  size?: 'sm' | 'md'
}

const PIECE_STYLES: Record<string, { white: string; black: string }> = {
  stone: {
    white:
      'bg-stone-50 shadow-[inset_0_4px_6px_rgba(255,255,255,0.65),inset_0_-2px_4px_rgba(0,0,0,0.08)] border-b-4 border-stone-400',
    black:
      'bg-zinc-800 shadow-[inset_0_2px_4px_rgba(255,255,255,0.12),inset_0_-3px_6px_rgba(0,0,0,0.55)] border-b-4 border-zinc-950',
  },
  'neon-cyan': {
    white:
      'bg-cyan-400 text-cyan-950 piece-neon-glow border-b-4 border-cyan-600 shadow-[0_0_14px_rgba(34,211,238,0.6)]',
    black:
      'bg-fuchsia-600 text-fuchsia-100 piece-neon-glow border-b-4 border-fuchsia-900 shadow-[0_0_14px_rgba(192,38,211,0.5)]',
  },
  'neon-fuchsia': {
    white: '',
    black: '',
  },
  gold: {
    white:
      'bg-gradient-to-br from-amber-100 to-amber-300 border-b-4 border-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.3)]',
    black:
      'bg-gradient-to-br from-zinc-700 to-zinc-900 border-b-4 border-amber-900/50',
  },
  marble: {
    white: 'bg-slate-100 border-b-4 border-slate-300',
    black: 'bg-slate-700 border-b-4 border-slate-900',
  },
  'mahogany-light': {
    white: 'bg-amber-100 border-b-4 border-amber-700',
    black: 'bg-amber-950 border-b-4 border-amber-950',
  },
  'mahogany-dark': {
    white: '',
    black: 'bg-amber-900 border-b-4 border-amber-950',
  },
  'pixel-white': {
    white:
      'piece-pixel bg-pink-400 border-2 border-pink-600 shadow-[3px_3px_0_#000] rounded-sm',
    black:
      'piece-pixel bg-indigo-500 border-2 border-indigo-800 shadow-[3px_3px_0_#000] rounded-sm',
  },
  'pixel-black': {
    white: '',
    black: '',
  },
  'cosmic-light': {
    white:
      'bg-gradient-to-br from-indigo-200 to-violet-400 border-b-4 border-indigo-500 shadow-[0_0_12px_rgba(167,139,250,0.5)]',
    black:
      'bg-gradient-to-br from-violet-800 to-fuchsia-900 border-b-4 border-violet-950 shadow-[0_0_10px_rgba(192,38,211,0.4)]',
  },
  'cosmic-dark': {
    white: '',
    black: '',
  },
}

export function CheckerPiece({
  cell,
  selected,
  highlight,
  size = 'md',
}: CheckerPieceProps) {
  const { activeSkin } = useStore()
  const { kidsMode } = usePreferences()
  const neonGlow = !!activeSkin.neonPieces

  if (cell === 0) return null

  const isWhite = cell === 1 || cell === 3
  const isKing = cell === 3 || cell === 4

  const dim =
    size === 'sm'
      ? 'h-[78%] w-[78%] min-h-5 min-w-5 max-h-7 max-w-7'
      : 'h-[82%] w-[82%] min-h-6 min-w-6 max-h-10 max-w-10'

  const styleKey = isWhite ? activeSkin.pieceWhite : activeSkin.pieceBlack
  const isPixel =
    styleKey === 'pixel-white' || activeSkin.id === 'retro-arcade'
  const base = [
    'relative flex items-center justify-center border border-black/10 transition-transform duration-150 ease-out',
    isPixel ? 'rounded-sm' : 'rounded-full',
  ].join(' ')
  const palette = PIECE_STYLES[styleKey] ?? PIECE_STYLES.stone
  let colorStyles = isWhite ? palette.white : palette.black

  const stateRing = selected
    ? 'ring-4 ring-amber-500/70 scale-105 z-10'
    : highlight
      ? 'ring-2 ring-amber-400/50'
      : ''

  const crownSize = size === 'sm' ? 11 : 15

  if (kidsMode) {
    return (
      <div
        className={`${base} ${dim} ${stateRing} bg-white text-2xl shadow-md`}
        aria-hidden
      >
        {isKing ? '👑' : isWhite ? '🦁' : '🐻'}
      </div>
    )
  }

  return (
    <div
      className={`${base} ${dim} ${colorStyles} ${stateRing} ${neonGlow ? 'piece-neon-glow' : ''}`}
      aria-hidden
    >
      <span
        className={`pointer-events-none absolute left-1/2 top-[12%] h-[28%] w-[50%] -translate-x-1/2 rounded-full ${
          isWhite ? 'bg-white/50' : 'bg-white/10'
        }`}
      />
      {isKing && (
        <Crown
          size={crownSize}
          strokeWidth={2.25}
          className={`relative z-10 ${activeSkin.crownClass ?? ''} ${
            isWhite
              ? 'fill-amber-500 text-amber-600'
              : 'fill-zinc-100 text-zinc-50'
          }`}
        />
      )}
    </div>
  )
}
