import { Trophy, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { PLAYER4_NAMES, type Player4Id } from '../../game/types'

interface VictoryOverlay4PProps {
  winner: Player4Id
  onPlayAgain: () => void
}

const WINNER_ACCENT: Record<Player4Id, string> = {
  1: 'text-stone-200',
  2: 'text-zinc-300',
  3: 'text-red-400',
  4: 'text-blue-400',
}

export function VictoryOverlay4P({ winner, onPlayAgain }: VictoryOverlay4PProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-8 text-center shadow-xl">
        <Trophy className="mx-auto mb-4 h-16 w-16 text-amber-500" strokeWidth={1.5} />
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Arena champion
        </p>
        <h2 className={`mt-2 text-3xl font-bold ${WINNER_ACCENT[winner]}`}>
          {PLAYER4_NAMES[winner]} wins
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Last player standing on the cross board.
        </p>
        <Button className="mt-8 w-full sm:w-auto" onClick={onPlayAgain}>
          <RotateCcw size={18} />
          New arena
        </Button>
      </div>
    </div>
  )
}
