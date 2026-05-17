import {
  applyMove,
  createInitialBoard,
  hasAnyCapture,
  stepsEqual,
  type Board,
} from './engine'
import {
  evaluatePosition,
  getScoredLegalMoves,
  scoreMoveForAnalysis,
  ANALYSIS_SEARCH_DEPTH,
} from './ai'
import type { GameMove, MoveStep, PlayerId, Position } from './types'

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'

export interface AnalyzedPly {
  plyIndex: number
  turnNumber: number
  player: PlayerId
  step: MoveStep
  classification: MoveClassification
  cpLoss: number
  evalAfterPlayed: number
  evalAfterBest: number
  notation: string
}

export interface MoveBreakdown {
  brilliant: number
  great: number
  best: number
  excellent: number
  inaccuracy: number
  mistake: number
  blunder: number
}

export interface PlayerReviewStats {
  player: PlayerId
  accuracy: number
  performanceElo: number
  breakdown: MoveBreakdown
  plies: AnalyzedPly[]
}

export interface EvalPoint {
  plyIndex: number
  /** Centipawns from White's perspective (+ = White better). */
  eval: number
}

export interface GameReviewReport {
  plies: AnalyzedPly[]
  evalTimeline: EvalPoint[]
  white: PlayerReviewStats
  black: PlayerReviewStats
  depth: number
}

export interface AnalyzeGameOptions {
  opponentElo?: number
  humanPlayer?: PlayerId
  result?: 'win' | 'loss' | 'draw'
  depth?: number
}

const CLASSIFICATION_WEIGHT: Record<MoveClassification, number> = {
  brilliant: 100,
  great: 100,
  best: 100,
  excellent: 85,
  inaccuracy: 50,
  mistake: 20,
  blunder: 0,
}

export const CLASSIFICATION_META: Record<
  MoveClassification,
  { label: string; short: string; color: string; bg: string }
> = {
  brilliant: {
    label: 'Brilliant',
    short: '!!',
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/20',
  },
  great: {
    label: 'Great',
    short: '!',
    color: 'text-sky-300',
    bg: 'bg-sky-500/20',
  },
  best: {
    label: 'Best',
    short: '★',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/20',
  },
  excellent: {
    label: 'Excellent',
    short: '✓',
    color: 'text-green-300',
    bg: 'bg-green-500/15',
  },
  inaccuracy: {
    label: 'Inaccuracy',
    short: '?!',
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/15',
  },
  mistake: {
    label: 'Mistake',
    short: '?',
    color: 'text-orange-300',
    bg: 'bg-orange-500/15',
  },
  blunder: {
    label: 'Blunder',
    short: '??',
    color: 'text-red-300',
    bg: 'bg-red-500/20',
  },
}

function emptyBreakdown(): MoveBreakdown {
  return {
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  }
}

function squareNotation(pos: { row: number; col: number }): string {
  const file = String.fromCharCode(97 + pos.col)
  const rank = 8 - pos.row
  return `${file}${rank}`
}

function formatNotation(step: MoveStep): string {
  return `${squareNotation(step.from)}×${squareNotation(step.to)}`
}

function evalForWhite(board: Board): number {
  return evaluatePosition(board, 1, 'balanced')
}

function classifyPly(
  board: Board,
  player: PlayerId,
  step: MoveStep,
  chainCapturePiece: Position | null,
  depth: number,
): {
  classification: MoveClassification
  cpLoss: number
  evalAfterPlayed: number
  evalAfterBest: number
} {
  const missedMandatory =
    (step.captured?.length ?? 0) === 0 && hasAnyCapture(board, player)

  const scored = getScoredLegalMoves(board, player, chainCapturePiece, depth)
  if (scored.length === 0) {
    return {
      classification: 'blunder',
      cpLoss: 999,
      evalAfterPlayed: 0,
      evalAfterBest: 0,
    }
  }

  const best = scored[0]
  const playedEntry = scored.find((s) => stepsEqual(s.move, step))
  const playedScore = playedEntry?.score ?? scoreMoveForAnalysis(
    board,
    step,
    player,
    chainCapturePiece,
    depth,
  )
  const bestScore = best.score
  const cpLoss = Math.max(0, bestScore - playedScore)

  const playedResult = applyMove(board, step, player, chainCapturePiece)
  const evalAfterPlayed = evaluatePosition(
    playedResult.board,
    player,
    'balanced',
  )

  const bestResult = applyMove(board, best.move, player, chainCapturePiece)
  const evalAfterBest = evaluatePosition(bestResult.board, player, 'balanced')

  const isPlayedBest = stepsEqual(step, best.move)
  const nearBestCount = scored.filter((s) => s.score >= bestScore - 15).length
  const sacrificedMaterial =
    (step.captured?.length ?? 0) > 0 && playedScore >= bestScore - 10
  const brilliantSwing = playedScore > bestScore + 25

  if (missedMandatory) {
    return { classification: 'blunder', cpLoss, evalAfterPlayed, evalAfterBest }
  }

  if (brilliantSwing || (sacrificedMaterial && evalAfterPlayed > 120)) {
    return { classification: 'brilliant', cpLoss, evalAfterPlayed, evalAfterBest }
  }

  if (isPlayedBest && nearBestCount === 1) {
    return { classification: 'great', cpLoss, evalAfterPlayed, evalAfterBest }
  }

  if (isPlayedBest || cpLoss < 8) {
    return { classification: 'best', cpLoss, evalAfterPlayed, evalAfterBest }
  }

  if (cpLoss < 15) {
    return { classification: 'excellent', cpLoss, evalAfterPlayed, evalAfterBest }
  }

  if (cpLoss < 60) {
    return { classification: 'inaccuracy', cpLoss, evalAfterPlayed, evalAfterBest }
  }

  if (cpLoss < 120) {
    return { classification: 'mistake', cpLoss, evalAfterPlayed, evalAfterBest }
  }

  return { classification: 'blunder', cpLoss, evalAfterPlayed, evalAfterBest }
}

function computeAccuracy(plies: AnalyzedPly[]): number {
  if (plies.length === 0) return 0
  const total = plies.reduce(
    (sum, p) => sum + CLASSIFICATION_WEIGHT[p.classification],
    0,
  )
  return Math.round(total / plies.length)
}

export function estimatePerformanceElo(
  opponentElo: number,
  accuracy: number,
  result: 'win' | 'loss' | 'draw' = 'draw',
): number {
  const base = opponentElo + (accuracy - 75) * 22
  const resultAdj =
    result === 'win' ? 45 : result === 'loss' ? -45 : 0
  return Math.round(Math.max(400, Math.min(2800, base + resultAdj)))
}

function buildPlayerStats(
  player: PlayerId,
  plies: AnalyzedPly[],
  opponentElo: number,
  result: 'win' | 'loss' | 'draw',
  humanPlayer: PlayerId,
): PlayerReviewStats {
  const playerPlies = plies.filter((p) => p.player === player)
  const breakdown = emptyBreakdown()
  for (const p of playerPlies) {
    breakdown[p.classification] += 1
  }

  const accuracy = computeAccuracy(playerPlies)
  const playerResult =
    player === humanPlayer
      ? result
      : result === 'win'
        ? 'loss'
        : result === 'loss'
          ? 'win'
          : 'draw'

  return {
    player,
    accuracy,
    performanceElo: estimatePerformanceElo(opponentElo, accuracy, playerResult),
    breakdown,
    plies: playerPlies,
  }
}

export function analyzeGame(
  history: GameMove[],
  options: AnalyzeGameOptions = {},
): GameReviewReport {
  const depth = options.depth ?? ANALYSIS_SEARCH_DEPTH
  const opponentElo = options.opponentElo ?? 1200
  const humanPlayer = options.humanPlayer ?? 1
  const result = options.result ?? 'draw'

  let board: Board = createInitialBoard()
  let chainCapturePiece: { row: number; col: number } | null = null
  const plies: AnalyzedPly[] = []
  const evalTimeline: EvalPoint[] = [{ plyIndex: 0, eval: evalForWhite(board) }]

  let plyIndex = 0
  let turnNumber = 1

  outer: for (const turn of history) {
    for (const step of turn.steps) {
      const { classification, cpLoss, evalAfterPlayed, evalAfterBest } =
        classifyPly(board, turn.player, step, chainCapturePiece, depth)

      plies.push({
        plyIndex,
        turnNumber,
        player: turn.player,
        step,
        classification,
        cpLoss,
        evalAfterPlayed,
        evalAfterBest,
        notation: formatNotation(step),
      })

      const moveResult = applyMove(board, step, turn.player, chainCapturePiece)
      board = moveResult.board
      chainCapturePiece = moveResult.chainCapturePiece
      plyIndex += 1
      evalTimeline.push({ plyIndex, eval: evalForWhite(board) })

      if (moveResult.winner) break outer
    }
    if (!chainCapturePiece) turnNumber += 1
  }

  const white = buildPlayerStats(1, plies, opponentElo, result, humanPlayer)
  const black = buildPlayerStats(2, plies, opponentElo, result, humanPlayer)

  return {
    plies,
    evalTimeline,
    white,
    black,
    depth,
  }
}

/** Reconstruct board position before ply `targetPly` (0 = initial). */
export function replayBoardAtPly(history: GameMove[], targetPly: number): Board {
  let board = createInitialBoard()
  let chain: { row: number; col: number } | null = null
  let idx = 0

  for (const turn of history) {
    for (const step of turn.steps) {
      if (idx >= targetPly) return board
      const result = applyMove(board, step, turn.player, chain)
      board = result.board
      chain = result.chainCapturePiece
      idx += 1
      if (result.winner) return board
    }
  }
  return board
}
