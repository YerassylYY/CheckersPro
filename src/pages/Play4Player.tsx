import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { Board4P } from '../components/board/Board4P'
import { VictoryOverlay4P } from '../components/game/VictoryOverlay4P'
import { Button } from '../components/ui/Button'
import { useGame4P } from '../context/Game4PContext'
import { useRecordGameResult } from '../hooks/useRecordGameResult'
import {
  PLAYER4_NAMES,
  PLAYER4_SIDE,
  TURN_ORDER_4P,
  type Player4Id,
} from '../game/types'

const SIDE_STYLES: Record<
  Player4Id,
  { pip: string; active: string; label: string }
> = {
  1: {
    pip: 'bg-stone-100 border-stone-400',
    active: 'border-stone-300 bg-zinc-800',
    label: 'text-stone-200',
  },
  2: {
    pip: 'bg-zinc-700 border-zinc-500',
    active: 'border-zinc-400 bg-zinc-800',
    label: 'text-zinc-200',
  },
  3: {
    pip: 'bg-red-700 border-red-900',
    active: 'border-red-500 bg-zinc-800',
    label: 'text-red-300',
  },
  4: {
    pip: 'bg-blue-600 border-blue-900',
    active: 'border-blue-400 bg-zinc-800',
    label: 'text-blue-300',
  },
}

function TurnIndicator({
  player,
  active,
  eliminated,
}: {
  player: Player4Id
  active: boolean
  eliminated: boolean
}) {
  const side = PLAYER4_SIDE[player]
  const style = SIDE_STYLES[player]

  const positionClass =
    side === 'bottom'
      ? 'bottom-0 left-1/2 -translate-x-1/2'
      : side === 'top'
        ? 'top-0 left-1/2 -translate-x-1/2'
        : side === 'left'
          ? 'left-0 top-1/2 -translate-y-1/2'
          : 'right-0 top-1/2 -translate-y-1/2'

  return (
    <div
      className={`absolute ${positionClass} z-10 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-150 ${
        eliminated
          ? 'border-zinc-800 bg-zinc-950/80 opacity-40 line-through'
          : active
            ? `${style.active} ring-1 ring-amber-500/60`
            : 'border-zinc-800 bg-zinc-900/90'
      }`}
    >
      <span
        className={`h-3 w-3 shrink-0 rounded-full border ${style.pip} ${eliminated ? 'opacity-30' : ''}`}
      />
      <span
        className={`whitespace-nowrap text-xs font-semibold ${eliminated ? 'text-zinc-600' : style.label}`}
      >
        {PLAYER4_NAMES[player]}
        {active && !eliminated && (
          <span className="ml-1 font-normal text-amber-400">· turn</span>
        )}
      </span>
    </div>
  )
}

export function Play4Player() {
  const { currentPlayer, winner, eliminated, resetGame, mustContinueFrom } =
    useGame4P()
  const { recordIfEnded, resetRecorder } = useRecordGameResult()

  useEffect(() => {
    if (winner) recordIfEnded(winner, 1, 'fourPlayer')
  }, [winner, recordIfEnded])

  const handleReset = () => {
    resetGame()
    resetRecorder()
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 px-2 py-3 sm:gap-4 sm:py-4">
      <div className="w-full text-center">
        <h1 className="text-lg font-semibold text-zinc-100">4-Player Arena</h1>
        <p className="text-xs text-zinc-500">
          {winner
            ? 'Game over'
            : mustContinueFrom
              ? `${PLAYER4_NAMES[currentPlayer]} — continue capture`
              : `${PLAYER4_NAMES[currentPlayer]} to move · clockwise`}
        </p>
        <p className="mt-1 text-[10px] text-zinc-600">
          Order: {TURN_ORDER_4P.map((p) => PLAYER4_NAMES[p]).join(' → ')}
        </p>
      </div>

      <div className="relative w-full pt-10 pb-10 pl-14 pr-14 sm:pt-12 sm:pb-12 sm:pl-16 sm:pr-16">
        {TURN_ORDER_4P.map((p) => (
          <TurnIndicator
            key={p}
            player={p}
            active={!winner && currentPlayer === p}
            eliminated={eliminated.includes(p)}
          />
        ))}
        <Board4P />
      </div>

      <Button variant="ghost" onClick={handleReset} className="text-xs">
        <RotateCcw size={14} />
        Reset arena
      </Button>

      {winner && <VictoryOverlay4P winner={winner} onPlayAgain={handleReset} />}
    </div>
  )
}