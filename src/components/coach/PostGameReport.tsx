import { useMemo } from 'react'
import { Brain, TrendingUp } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { analyzeMatch, overallGrade } from '../../game/aiCoach'
import type { GameMove, PlayerId } from '../../game/types'

interface PostGameReportProps {
  open: boolean
  onClose: () => void
  history: GameMove[]
  playerPerspective: PlayerId
}

const typeStyles = {
  excellent: 'border-emerald-800 bg-emerald-950/40 text-emerald-200',
  good: 'border-zinc-700 bg-zinc-800/80 text-zinc-200',
  mistake: 'border-amber-900/60 bg-amber-950/30 text-amber-200',
  blunder: 'border-red-900/60 bg-red-950/30 text-red-200',
}

export function PostGameReport({
  open,
  onClose,
  history,
  playerPerspective,
}: PostGameReportProps) {
  const insights = useMemo(
    () => analyzeMatch(history, playerPerspective),
    [history, playerPerspective],
  )
  const grade = overallGrade(insights)

  return (
    <Modal open={open} onClose={onClose} title="AI Coach Report" size="xl">
      <div className="mb-4 flex items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
        <Brain className="h-10 w-10 shrink-0 text-emerald-400" strokeWidth={1.5} />
        <div>
          <p className="text-sm text-zinc-400">Performance grade</p>
          <p className="text-3xl font-bold tabular-nums text-zinc-100">{grade}</p>
        </div>
        <TrendingUp className="ml-auto h-8 w-8 text-zinc-600" aria-hidden />
      </div>

      <p className="mb-3 text-xs text-zinc-500">
        {history.length} turns analyzed · rule-based tactical scan
      </p>

      <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {insights.map((insight, i) => (
          <li
            key={`${insight.moveNumber}-${i}`}
            className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${typeStyles[insight.type]}`}
          >
            {insight.message}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-center text-xs text-zinc-600">
        Insights generated from your actual move log — not generic templates.
      </p>
    </Modal>
  )
}
