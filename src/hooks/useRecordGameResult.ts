import { useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import type { MatchResult } from '../lib/stats'
import type { GameMode, PlayerId } from '../game/types'

function modeLabel(mode: GameMode, blitzMode?: boolean): string {
  if (blitzMode) return 'Checkers Blitz'
  switch (mode) {
    case 'ai':
      return 'vs AI'
    case 'fourPlayer':
      return '4-Player Arena'
    case 'online':
      return 'Online Blitz'
    default:
      return 'Local 1v1'
  }
}

function opponentLabel(mode: GameMode, override?: string): string {
  if (override) return override
  switch (mode) {
    case 'ai':
      return 'Computer'
    case 'fourPlayer':
      return 'Arena (3 opponents)'
    case 'online':
      return 'Online opponent'
    default:
      return 'Local opponent'
  }
}

export interface MatchReviewStats {
  opponent?: string
  opponentElo?: number
  accuracy?: number
  performanceElo?: number
  blitzMode?: boolean
}

/**
 * Records a single match result when the game ends (guards double-fire).
 */
export function useRecordGameResult() {
  const { user, recordMatch } = useAuth()
  const recordedRef = useRef(false)

  const resetRecorder = useCallback(() => {
    recordedRef.current = false
  }, [])

  const recordIfEnded = useCallback(
    (
      winner: PlayerId | number | null,
      humanPlayer: PlayerId,
      mode: GameMode,
      review?: MatchReviewStats,
    ) => {
      if (!winner || !user || recordedRef.current) return

      let result: MatchResult
      if (winner === humanPlayer) result = 'win'
      else result = 'loss'

      recordMatch({
        mode: modeLabel(mode, review?.blitzMode),
        result,
        opponent: opponentLabel(mode, review?.opponent),
        opponentElo: review?.opponentElo,
        accuracy: review?.accuracy,
        performanceElo: review?.performanceElo,
      })

      recordedRef.current = true
    },
    [user, recordMatch],
  )

  return { recordIfEnded, resetRecorder }
}
