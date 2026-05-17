import { useEffect, useMemo, useState } from 'react'
import { BarChart3, List, Loader2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import {
  analyzeGame,
  CLASSIFICATION_META,
  replayBoardAtPly,
  type GameReviewReport,
  type MoveClassification,
  type MoveBreakdown,
} from '../../game/analyzer'
import { AccuracyDial } from './review/AccuracyDial'
import { AdvantageChart } from './review/AdvantageChart'
import { ReviewMiniBoard } from './review/ReviewMiniBoard'
import type { GameMove, PlayerId } from '../../game/types'

type TabId = 'summary' | 'timeline' | 'graph'

interface GameReviewDashboardProps {
  open: boolean
  onClose: () => void
  history: GameMove[]
  humanPlayer: PlayerId
  opponentName: string
  opponentElo: number
  result: 'win' | 'loss' | 'draw'
  initialReport?: GameReviewReport | null
}

const BREAKDOWN_ORDER: MoveClassification[] = [
  'brilliant',
  'great',
  'best',
  'excellent',
  'inaccuracy',
  'mistake',
  'blunder',
]

function BreakdownGrid({
  white,
  black,
}: {
  white: MoveBreakdown
  black: MoveBreakdown
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-500">
            <th className="px-3 py-2 font-medium">Move type</th>
            <th className="px-3 py-2 text-center">White</th>
            <th className="px-3 py-2 text-center">Black</th>
          </tr>
        </thead>
        <tbody>
          {BREAKDOWN_ORDER.map((key) => {
            const meta = CLASSIFICATION_META[key]
            return (
              <tr key={key} className="border-b border-zinc-800/60">
                <td className={`px-3 py-2 ${meta.color}`}>
                  <span className={`mr-2 inline-block rounded px-1.5 py-0.5 ${meta.bg}`}>
                    {meta.short}
                  </span>
                  {meta.label}
                </td>
                <td className="px-3 py-2 text-center tabular-nums text-zinc-200">
                  {white[key]}
                </td>
                <td className="px-3 py-2 text-center tabular-nums text-zinc-200">
                  {black[key]}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function GameReviewDashboard({
  open,
  onClose,
  history,
  humanPlayer,
  opponentName,
  opponentElo,
  result,
  initialReport,
}: GameReviewDashboardProps) {
  const [tab, setTab] = useState<TabId>('summary')
  const [report, setReport] = useState<GameReviewReport | null>(initialReport ?? null)
  const [loading, setLoading] = useState(false)
  const [selectedPly, setSelectedPly] = useState(0)

  useEffect(() => {
    if (!open) return
    if (initialReport) {
      setReport(initialReport)
      setLoading(false)
      return
    }
    if (history.length === 0) return

    setLoading(true)
    setReport(null)
    const handle = window.setTimeout(() => {
      const r = analyzeGame(history, {
        opponentElo,
        humanPlayer,
        result,
        depth: 5,
      })
      setReport(r)
      setLoading(false)
    }, 16)

    return () => window.clearTimeout(handle)
  }, [open, history, opponentElo, humanPlayer, result, initialReport])

  const selectedPlyData = report?.plies.find((p) => p.plyIndex === selectedPly)
  const previewBoard = useMemo(() => {
    if (!open || history.length === 0) return null
    return replayBoardAtPly(history, selectedPly)
  }, [open, history, selectedPly])

  const tabs: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'timeline', label: 'Moves', icon: List },
    { id: 'graph', label: 'Advantage', icon: BarChart3 },
  ]

  const humanStats =
    humanPlayer === 1 ? report?.white : report?.black
  const oppStats =
    humanPlayer === 1 ? report?.black : report?.white

  return (
    <Modal open={open} onClose={onClose} title="Game Review" size="2xl">
      <p className="-mt-2 mb-4 text-sm text-zinc-500">
        vs {opponentName} · Engine depth {report?.depth ?? 5}
      </p>

      <div className="mb-4 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors ${
              tab === id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="mt-3 text-sm text-zinc-500">
            Running minimax review (depth 5)…
          </p>
        </div>
      )}

      {!loading && report && tab === 'summary' && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <AccuracyDial
              label={humanPlayer === 1 ? 'You (White)' : 'You (Black)'}
              accuracy={humanStats?.accuracy ?? 0}
              performanceElo={humanStats?.performanceElo ?? 0}
              accentClass="text-emerald-400"
            />
            <AccuracyDial
              label={opponentName}
              accuracy={oppStats?.accuracy ?? 0}
              performanceElo={oppStats?.performanceElo ?? opponentElo}
              accentClass="text-zinc-400"
            />
          </div>
          <BreakdownGrid white={report.white.breakdown} black={report.black.breakdown} />
        </div>
      )}

      {!loading && report && tab === 'timeline' && (
        <div className="flex flex-col gap-4 lg:flex-row">
          <ul className="max-h-80 flex-1 space-y-1 overflow-y-auto pr-1 lg:max-h-[360px]">
            {report.plies.map((ply) => {
              const meta = CLASSIFICATION_META[ply.classification]
              const isHuman = ply.player === humanPlayer
              return (
                <li key={ply.plyIndex}>
                  <button
                    type="button"
                    onClick={() => setSelectedPly(ply.plyIndex)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      selectedPly === ply.plyIndex
                        ? 'border-amber-700/50 bg-amber-950/30'
                        : 'border-transparent bg-zinc-900/50 hover:bg-zinc-800/80'
                    }`}
                  >
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-bold ${meta.bg} ${meta.color}`}
                    >
                      {meta.short}
                    </span>
                    <span className="text-zinc-500">
                      {ply.turnNumber}.
                      {isHuman ? ' You' : ` ${opponentName}`}
                    </span>
                    <span className="truncate font-mono text-zinc-300">
                      {ply.notation}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="shrink-0 lg:w-56">
            {previewBoard && (
              <>
                <ReviewMiniBoard
                  board={previewBoard}
                  highlight={selectedPlyData?.step.to ?? null}
                />
                {selectedPlyData && (
                  <p className="mt-2 text-center text-xs text-zinc-500">
                    {CLASSIFICATION_META[selectedPlyData.classification].label} ·
                    −{selectedPlyData.cpLoss} cp
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {!loading && report && tab === 'graph' && (
        <AdvantageChart
          points={report.evalTimeline}
          selectedPly={selectedPly}
          onSelectPly={setSelectedPly}
        />
      )}

      {humanStats && !loading && (
        <p className="mt-4 text-center text-xs text-zinc-600">
          Your accuracy saved to match history · {humanStats.accuracy}% · ~
          {humanStats.performanceElo} ELO performance
        </p>
      )}
    </Modal>
  )
}
