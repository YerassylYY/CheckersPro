import {
  applyMove,
  createInitialBoard,
  hasAnyCapture,
  isMan,
  type Board,
} from './engine'
import type { GameMove, MoveStep, PlayerId } from './types'

export type CoachInsightType = 'excellent' | 'good' | 'mistake' | 'blunder'

export interface CoachInsight {
  moveNumber: number
  type: CoachInsightType
  message: string
}

const BACK_ROW: Record<PlayerId, number> = { 1: 7, 2: 0 }

function getOwnerFromCell(cell: number): PlayerId | null {
  if (cell === 1 || cell === 3) return 1
  if (cell === 2 || cell === 4) return 2
  return null
}

function stepHadCapture(step: MoveStep): boolean {
  return (step.captured?.length ?? 0) > 0
}

function replayBoardThroughHistory(
  history: GameMove[],
  upToExclusive: number,
): Board {
  let board = createInitialBoard()
  let mustContinue: { row: number; col: number } | null = null

  for (let i = 0; i < upToExclusive; i++) {
    const turn = history[i]
    for (const step of turn.steps) {
      const result = applyMove(board, step, turn.player, mustContinue)
      board = result.board
      mustContinue = result.chainCapturePiece
    }
    mustContinue = null
  }
  return board
}

function detectMissedCapture(
  boardBefore: Board,
  turn: GameMove,
  moveNumber: number,
  player: PlayerId,
): CoachInsight | null {
  if (!hasAnyCapture(boardBefore, player)) return null
  if (turn.steps.every((s) => stepHadCapture(s))) return null

  return {
    moveNumber,
    type: 'mistake',
    message: `Analysis on Move ${moveNumber}: You hesitated before taking a mandatory capture. Keep an eye on forcing lines!`,
  }
}

function detectBackRowExposure(
  history: GameMove[],
  turnIndex: number,
  player: PlayerId,
): CoachInsight | null {
  const moveNumber = turnIndex + 1
  if (moveNumber > 12) return null

  const turn = history[turnIndex]
  const first = turn.steps[0]
  if (!first) return null

  const boardBefore = replayBoardThroughHistory(history, turnIndex)
  const fromCell = boardBefore[first.from.row]?.[first.from.col]
  if (!isMan(fromCell) || getOwnerFromCell(fromCell) !== player) return null
  if (first.from.row !== BACK_ROW[player]) return null

  return {
    moveNumber,
    type: 'mistake',
    message: `Strategic Warning on Move ${moveNumber}: Moving this piece exposed your back row, helping your opponent crown a King.`,
  }
}

function detectBlindSpot(
  history: GameMove[],
  turnIndex: number,
  player: PlayerId,
): CoachInsight | null {
  const moveNumber = turnIndex + 1
  const turn = history[turnIndex]
  const lastStep = turn.steps[turn.steps.length - 1]
  if (!lastStep) return null

  const opponent: PlayerId = player === 1 ? 2 : 1
  const landed = lastStep.to

  for (let j = turnIndex + 1; j < history.length; j++) {
    const oppTurn = history[j]
    if (oppTurn.player !== opponent) break

    for (const step of oppTurn.steps) {
      if (!stepHadCapture(step)) continue
      const cap = step.captured?.[0]
      if (cap && cap.row === landed.row && cap.col === landed.col) {
        return {
          moveNumber,
          type: 'blunder',
          message: `Tactical Error on Move ${moveNumber}: Moving to this square put your piece in immediate danger without a tactical trade.`,
        }
      }
    }
    break
  }

  return null
}

function detectExcellentPlays(
  turn: GameMove,
  moveNumber: number,
  player: PlayerId,
): CoachInsight[] {
  const out: CoachInsight[] = []
  const caps = turn.steps.reduce((n, s) => n + (s.captured?.length ?? 0), 0)

  if (caps >= 2) {
    out.push({
      moveNumber,
      type: 'excellent',
      message: `Move ${moveNumber}: Strong multi-capture — you removed ${caps} pieces in one turn.`,
    })
  } else if (caps === 1) {
    out.push({
      moveNumber,
      type: 'good',
      message: `Move ${moveNumber}: Timely capture that improved your position.`,
    })
  }

  const last = turn.steps[turn.steps.length - 1]
  if (last) {
    const crowned =
      (player === 1 && last.to.row === 0) ||
      (player === 2 && last.to.row === 7)
    if (crowned) {
      out.push({
        moveNumber,
        type: 'excellent',
        message: `Move ${moveNumber}: Crowned a King — your flying piece now controls long diagonals.`,
      })
    }
  }

  return out
}

/**
 * Rule-based post-game analysis from the compiled move log.
 */
export function analyzeMatch(
  history: GameMove[],
  playerPerspective: PlayerId,
): CoachInsight[] {
  if (history.length === 0) {
    return [
      {
        moveNumber: 0,
        type: 'good',
        message: 'No moves recorded — play a full match to unlock detailed coaching.',
      },
    ]
  }

  const insights: CoachInsight[] = []
  const seen = new Set<string>()

  const add = (insight: CoachInsight | null) => {
    if (!insight) return
    const key = `${insight.moveNumber}-${insight.type}`
    if (seen.has(key)) return
    seen.add(key)
    insights.push(insight)
  }

  history.forEach((turn, turnIndex) => {
    if (turn.player !== playerPerspective) return

    const moveNumber = turnIndex + 1
    const boardBefore = replayBoardThroughHistory(history, turnIndex)

    add(detectMissedCapture(boardBefore, turn, moveNumber, playerPerspective))
    add(detectBackRowExposure(history, turnIndex, playerPerspective))
    add(detectBlindSpot(history, turnIndex, playerPerspective))

    for (const ex of detectExcellentPlays(turn, moveNumber, playerPerspective)) {
      add(ex)
    }
  })

  if (insights.length === 0) {
    insights.push({
      moveNumber: 1,
      type: 'good',
      message:
        'Solid game — maintain center control and scan for forcing captures each turn.',
    })
  }

  return insights
    .sort((a, b) => a.moveNumber - b.moveNumber)
    .slice(0, 10)
}

export function overallGrade(insights: CoachInsight[]): string {
  const scores: Record<CoachInsightType, number> = {
    excellent: 4,
    good: 3,
    mistake: 1,
    blunder: 0,
  }
  const avg =
    insights.reduce((s, i) => s + scores[i.type], 0) /
    Math.max(insights.length, 1)
  if (avg >= 3.5) return 'A'
  if (avg >= 2.5) return 'B+'
  if (avg >= 2) return 'B'
  return 'C+'
}
