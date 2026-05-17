import { useEffect, useState } from 'react'
import { Crown, Loader2, RotateCcw } from 'lucide-react'
import { Board8x8 } from '../board/Board8x8'
import { BlitzClock } from './BlitzClock'
import { VictoryOverlay } from './VictoryOverlay'
import { GameReviewDashboard } from './GameReviewDashboard'
import { PostGameReport } from '../coach/PostGameReport'
import { Button } from '../ui/Button'
import { useGame } from '../../context/GameContext'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../context/StoreContext'
import { useGamification } from '../../context/GamificationContext'
import { useBlitzTimer, BLITZ_DURATION } from '../../hooks/useBlitzTimer'
import { usePostGameReview } from '../../hooks/usePostGameReview'
import { PLAYER_NAMES, type RulesVariant } from '../../game/types'
import { RULES_VARIANT_LABELS } from '../../lib/rulesVariant'
import { RulesVariantPicker } from './RulesVariantPicker'
import type { BotProfile } from '../../data/bots'

interface GameSessionProps {
  blitzMode?: boolean
  aiBot?: BotProfile
  onGameStarted?: () => void
  initialRulesVariant?: RulesVariant
}

export function GameSession({
  blitzMode = false,
  aiBot,
  onGameStarted,
  initialRulesVariant = 'STANDARD',
}: GameSessionProps) {
  const {
    currentPlayer,
    winner,
    resetGame,
    mode,
    isAiThinking,
    moveHistory,
    mustContinueFrom,
    applyFlagFall,
    aiDifficulty,
    rulesVariant,
    setRulesVariant,
  } = useGame()

  const { user } = useAuth()
  const { openProModal } = useStore()
  const { recordAiWin, recordBlitzComplete } = useGamification()
  const [showCoach, setShowCoach] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [lowTimePlayer, setLowTimePlayer] = useState<1 | 2 | null>(null)

  const timer = useBlitzTimer(true, currentPlayer, !!winner || isAiThinking, {
    durationSeconds: BLITZ_DURATION,
    onLowTime: (_s, p) => setLowTimePlayer(p),
  })
  const humanPlayer = 1 as const

  const {
    report: reviewReport,
    reviewOpen,
    setReviewOpen,
    resetReview,
  } = usePostGameReview({
    moveHistory,
    winner: winner ?? null,
    humanPlayer,
    mode: blitzMode ? 'local' : mode,
    blitzMode,
    aiBot,
    userElo: user?.elo,
  })

  const opponentLabel =
    aiBot?.name ?? (mode === 'ai' ? 'Computer' : blitzMode ? 'Blitz' : 'Opponent')
  const opponentElo = aiBot?.elo ?? user?.elo ?? 1200

  useEffect(() => {
    setRulesVariant(initialRulesVariant)
  }, [initialRulesVariant, setRulesVariant])

  useEffect(() => {
    if (gameStarted && !winner) timer.start()
  }, [currentPlayer, gameStarted, winner])

  useEffect(() => {
    if (timer.flagFallWinner) {
      applyFlagFall(timer.flagFallWinner)
    }
  }, [timer.flagFallWinner, applyFlagFall])

  useEffect(() => {
    if (winner) {
      if (mode === 'ai' && winner === humanPlayer) {
        recordAiWin(aiDifficulty)
      }
      if (blitzMode) recordBlitzComplete()
    }
  }, [winner, mode, blitzMode, recordAiWin, recordBlitzComplete, aiDifficulty])

  const handleStart = () => {
    setGameStarted(true)
    timer.reset()
    timer.start()
    onGameStarted?.()
  }

  const handlePlayAgain = () => {
    resetGame()
    resetReview()
    setShowCoach(false)
    setGameStarted(false)
    setLowTimePlayer(null)
    timer.reset()
  }

  const handleGameReview = () => setReviewOpen(true)

  const handleCoach = () => {
    if (!user?.isPro) {
      openProModal()
      return
    }
    setShowCoach(true)
  }

  const modeLabel = blitzMode
    ? `Blitz · ${RULES_VARIANT_LABELS[rulesVariant]}`
    : mode === 'ai' && aiBot
      ? `vs ${aiBot.name} · ${RULES_VARIANT_LABELS[rulesVariant]}`
      : mode === 'ai'
        ? `vs Computer · ${RULES_VARIANT_LABELS[rulesVariant]}`
        : mode === 'online'
          ? `Online · ${RULES_VARIANT_LABELS[rulesVariant]}`
          : `Local · ${RULES_VARIANT_LABELS[rulesVariant]}`

  const handleVariantChange = (v: RulesVariant) => {
    setRulesVariant(v)
    resetGame()
    resetReview()
    setGameStarted(false)
    timer.reset()
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 px-2 py-3 sm:gap-4 sm:py-4">
      <BlitzClock
        p1Display={timer.p1Display}
        p2Display={timer.p2Display}
        activePlayer={gameStarted && !winner ? currentPlayer : null}
        urgentPlayer={lowTimePlayer}
      />

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300">
          {modeLabel}
        </span>
        {blitzMode && (
          <span className="rounded-md border border-amber-900/50 bg-amber-950/40 px-2.5 py-1 text-xs text-amber-300">
            180s strict
          </span>
        )}
        {isAiThinking && (
          <span className="flex items-center gap-1 text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">Thinking…</span>
          </span>
        )}
        {mustContinueFrom && (
          <span className="rounded-md border border-rose-900/50 bg-rose-950/40 px-2.5 py-1 text-xs font-medium text-rose-300">
            Continue capture
          </span>
        )}
        {!gameStarted && !winner && (
          <Button onClick={handleStart} className="text-xs py-2">
            Start clock
          </Button>
        )}
      </div>

      <p className="text-sm text-zinc-400">
        <span className="text-zinc-500">Turn · </span>
        <span className="font-semibold text-zinc-100">{PLAYER_NAMES[currentPlayer]}</span>
      </p>

      {!winner && (
        <RulesVariantPicker
          value={rulesVariant}
          onChange={handleVariantChange}
          disabled={gameStarted && moveHistory.length > 0}
        />
      )}

      <Board8x8 />

      <Button variant="ghost" onClick={handlePlayAgain} className="text-xs">
        <RotateCcw size={14} />
        New game
      </Button>

      {winner && (
        <VictoryOverlay
          winner={winner}
          reason={
            timer.flagFallWinner
              ? 'Time expired'
              : 'All pieces captured or blocked'
          }
          onPlayAgain={handlePlayAgain}
          onAnalyze={handleGameReview}
          analyzeLabel="Game Review"
        />
      )}

      <GameReviewDashboard
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        history={moveHistory}
        humanPlayer={humanPlayer}
        opponentName={opponentLabel}
        opponentElo={opponentElo}
        result={
          winner === humanPlayer
            ? 'win'
            : winner
              ? 'loss'
              : 'draw'
        }
        initialReport={reviewReport}
      />

      <PostGameReport
        open={showCoach}
        onClose={() => setShowCoach(false)}
        history={moveHistory}
        playerPerspective={humanPlayer}
      />

      {winner && (
        <button
          type="button"
          onClick={handleCoach}
          className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400"
        >
          <Crown size={12} className="text-amber-500" />
          {user?.isPro ? 'AI Coach report' : 'AI Coach (Pro)'}
        </button>
      )}
    </div>
  )
}
