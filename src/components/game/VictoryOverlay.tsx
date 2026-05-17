import { Trophy, RotateCcw, BarChart3 } from 'lucide-react'
import { Button } from '../ui/Button'
import { PLAYER_NAMES, type PlayerId } from '../../game/types'

interface VictoryOverlayProps {
  winner: PlayerId
  reason?: string
  onPlayAgain: () => void
  onAnalyze?: () => void
  analyzeLabel?: string
}

export function VictoryOverlay({
  winner,
  reason = 'Game over',
  onPlayAgain,
  onAnalyze,
  analyzeLabel = 'Game Review',
}: VictoryOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-8 text-center shadow-xl">
        <Trophy className="mx-auto mb-4 h-14 w-14 text-amber-500" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-white">{PLAYER_NAMES[winner]} wins</h2>
        <p className="mt-2 text-sm text-zinc-400">{reason}</p>
        <div className="mt-6 flex flex-col gap-2">
          {onAnalyze && (
            <Button onClick={onAnalyze}>
              <BarChart3 size={18} />
              {analyzeLabel}
            </Button>
          )}
          <Button variant="secondary" onClick={onPlayAgain}>
            <RotateCcw size={16} />
            Play again
          </Button>
        </div>
      </div>
    </div>
  )
}
