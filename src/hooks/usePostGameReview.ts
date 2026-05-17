import { useEffect, useRef, useState } from 'react'
import { analyzeGame, type GameReviewReport } from '../game/analyzer'
import { useRecordGameResult } from './useRecordGameResult'
import type { BotProfile } from '../data/bots'
import type { GameMode, GameMove, PlayerId } from '../game/types'

interface UsePostGameReviewOptions {
  moveHistory: GameMove[]
  winner: PlayerId | null
  humanPlayer: PlayerId
  mode: GameMode
  blitzMode?: boolean
  aiBot?: BotProfile
  userElo?: number
  opponentName?: string
  opponentElo?: number
  /** Online PvP records via MultiplayerContext instead. */
  skipMatchRecord?: boolean
}

export function usePostGameReview({
  moveHistory,
  winner,
  humanPlayer,
  mode,
  blitzMode,
  aiBot,
  userElo,
  opponentName,
  opponentElo: opponentEloOverride,
  skipMatchRecord,
}: UsePostGameReviewOptions) {
  const { recordIfEnded, resetRecorder } = useRecordGameResult()
  const [report, setReport] = useState<GameReviewReport | null>(null)
  const [open, setOpen] = useState(false)
  const analyzedForRef = useRef<string | null>(null)

  useEffect(() => {
    if (!winner) {
      analyzedForRef.current = null
      setReport(null)
      setOpen(false)
      return
    }

    const key = `${winner}-${moveHistory.length}`
    if (analyzedForRef.current === key) return
    analyzedForRef.current = key

    const result = winner === humanPlayer ? 'win' : 'loss'
    const opponentElo =
      opponentEloOverride ?? aiBot?.elo ?? userElo ?? 1200
    const opponent =
      opponentName ??
      aiBot?.name ??
      (mode === 'ai' ? 'Computer' : blitzMode ? 'Blitz opponent' : 'Opponent')

    const run = () => {
      if (moveHistory.length === 0) {
        if (!skipMatchRecord) {
          recordIfEnded(winner, humanPlayer, mode, {
            blitzMode,
            opponent,
            opponentElo,
          })
        }
        return
      }

      const r = analyzeGame(moveHistory, {
        opponentElo,
        humanPlayer,
        result,
        depth: 5,
      })
      const humanStats = humanPlayer === 1 ? r.white : r.black
      setReport(r)
      if (!skipMatchRecord) {
        recordIfEnded(winner, humanPlayer, mode, {
          blitzMode,
          opponent,
          opponentElo,
          accuracy: humanStats.accuracy,
          performanceElo: humanStats.performanceElo,
        })
      }
      setOpen(true)
    }

    const handle = window.setTimeout(run, 0)
    return () => window.clearTimeout(handle)
  }, [
    winner,
    moveHistory,
    humanPlayer,
    mode,
    blitzMode,
    aiBot,
    userElo,
    recordIfEnded,
    skipMatchRecord,
    opponentName,
    opponentEloOverride,
  ])

  return {
    report,
    reviewOpen: open,
    setReviewOpen: setOpen,
    resetReview: () => {
      analyzedForRef.current = null
      setReport(null)
      setOpen(false)
      resetRecorder()
    },
  }
}
