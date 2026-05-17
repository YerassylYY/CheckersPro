import {
  applyMove,
  BOARD_SIZE,
  getLegalMoves,
  getOwner,
  hasAnyCapture,
  isKing,
  isMan,
  isPlayable,
  type Board,
} from './engine'
import type { BotProfile, BotStyle } from '../data/bots'
import type { MoveStep, PlayerId, Position, RulesVariant } from './types'

export const AI_THINK_DELAY_MS = 600

const MATE_SCORE = 100_000
const MAN_VALUE = 100
const KING_VALUE = 300

const CENTER_ROW_MIN = 3
const CENTER_ROW_MAX = 5
const CENTER_COL_MIN = 2
const CENTER_COL_MAX = 5

const BACK_ROW: Record<PlayerId, number> = { 1: 7, 2: 0 }
const PROMOTION_ROW: Record<PlayerId, number> = { 1: 0, 2: 7 }

function opponentOf(player: PlayerId): PlayerId {
  return player === 1 ? 2 : 1
}

function isCenterSquare(row: number, col: number): boolean {
  return (
    isPlayable(row, col) &&
    row >= CENTER_ROW_MIN &&
    row <= CENTER_ROW_MAX &&
    col >= CENTER_COL_MIN &&
    col <= CENTER_COL_MAX
  )
}

function advancementScore(player: PlayerId, row: number): number {
  if (player === 1) return (BOARD_SIZE - 1 - row) * 4
  return row * 4
}

function backRowDefenseBonus(board: Board, player: PlayerId, style: BotStyle): number {
  const back = BACK_ROW[player]
  let bonus = 0
  const mult =
    style === 'defensive' ? 2.2 : style === 'aggressive' ? 0.45 : 1
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (!isPlayable(back, c)) continue
    const cell = board[back][c]
    if (getOwner(cell) === player && isMan(cell)) bonus += 14 * mult
  }
  return bonus
}

function backRowExposurePenalty(board: Board, player: PlayerId, style: BotStyle): number {
  const back = BACK_ROW[player]
  const ownHalfThreshold = player === 1 ? 4 : 3
  let penalty = 0
  const mult =
    style === 'defensive' ? 1.8 : style === 'aggressive' ? 0.35 : 1

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!isPlayable(r, c)) continue
      const cell = board[r][c]
      if (getOwner(cell) !== player || !isMan(cell)) continue

      const inOwnHalf = player === 1 ? r > ownHalfThreshold : r < ownHalfThreshold
      if (!inOwnHalf) continue

      if (isPlayable(back, c) && board[back][c] === 0) {
        penalty += 10 * mult
      }
    }
  }
  return penalty
}

/** Aggressive bots favor occupying central / forward bands (rows 4–6 for White, 2–4 for Black). */
function styleForwardBonus(player: PlayerId, row: number, style: BotStyle): number {
  if (style !== 'aggressive') return 0
  if (player === 1 && row >= 4 && row <= 6) return 20
  if (player === 2 && row >= 2 && row <= 4) return 20
  return 0
}

/** Defensive bots penalize pieces stranded in the opponent\'s half without support. */
function styleHoldBackBonus(player: PlayerId, row: number, style: BotStyle): number {
  if (style !== 'defensive') return 0
  if (player === 1 && row >= 5) return 8
  if (player === 2 && row <= 2) return 8
  return 0
}

function mobilityScore(
  board: Board,
  player: PlayerId,
  rulesVariant: RulesVariant = 'STANDARD',
): number {
  const opp = opponentOf(player)
  const myMoves = getLegalMoves(board, player, null, rulesVariant).length
  const oppMoves = getLegalMoves(board, opp, null, rulesVariant).length
  if (rulesVariant === 'GIVEAWAY') return (oppMoves - myMoves) * 6
  return (myMoves - oppMoves) * 6
}

function captureThreatBonus(
  board: Board,
  player: PlayerId,
  rulesVariant: RulesVariant = 'STANDARD',
): number {
  const caps = getLegalMoves(board, player, null, rulesVariant).filter(
    (m) => (m.captured?.length ?? 0) > 0,
  ).length
  return caps * 12
}

export function evaluatePosition(
  board: Board,
  perspective: PlayerId,
  style: BotStyle = 'balanced',
  rulesVariant: RulesVariant = 'STANDARD',
): number {
  const opponent = opponentOf(perspective)
  let score = 0

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!isPlayable(r, c)) continue
      const cell = board[r][c]
      const owner = getOwner(cell)
      if (!owner) continue

      const sign =
        rulesVariant === 'GIVEAWAY'
          ? owner === perspective
            ? -1
            : 1
          : owner === perspective
            ? 1
            : -1
      let pieceScore = isKing(cell) ? KING_VALUE : MAN_VALUE

      if (isMan(cell)) {
        pieceScore += advancementScore(owner, r)
        pieceScore += styleForwardBonus(owner, r, style)
        pieceScore += styleHoldBackBonus(owner, r, style)
        if (isCenterSquare(r, c)) pieceScore += 18
        else {
          const dist = Math.abs(r - 4) + Math.abs(c - 3.5)
          pieceScore += Math.max(0, 12 - dist * 2)
        }
        if (r === PROMOTION_ROW[owner]) pieceScore += 25
      } else if (isCenterSquare(r, c)) {
        pieceScore += 12
      }

      score += sign * pieceScore
    }
  }

  score += backRowDefenseBonus(board, perspective, style)
  score -= backRowExposurePenalty(board, perspective, style)
  score += backRowDefenseBonus(board, opponent, style) * -0.5
  score += backRowExposurePenalty(board, opponent, style) * 0.5

  score += mobilityScore(board, perspective, rulesVariant)
  score += captureThreatBonus(board, perspective, rulesVariant)

  if (style === 'aggressive') {
    score += captureThreatBonus(board, perspective, rulesVariant) * 0.5
  }

  return score
}

function orderMoves(moves: MoveStep[]): MoveStep[] {
  return [...moves].sort((a, b) => {
    const capA = a.captured?.length ?? 0
    const capB = b.captured?.length ?? 0
    if (capB !== capA) return capB - capA
    return 0
  })
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  aiPlayer: PlayerId,
  currentPlayer: PlayerId,
  chainCapturePiece: Position | null,
  evalStyle: BotStyle,
  rulesVariant: RulesVariant = 'STANDARD',
): number {
  if (depth === 0) {
    return evaluatePosition(board, aiPlayer, evalStyle, rulesVariant)
  }

  const moves = getLegalMoves(board, currentPlayer, chainCapturePiece, rulesVariant)

  if (moves.length === 0) {
    if (rulesVariant === 'GIVEAWAY') {
      return currentPlayer === aiPlayer ? MATE_SCORE - depth : -MATE_SCORE + depth
    }
    return currentPlayer === aiPlayer ? -MATE_SCORE + depth : MATE_SCORE - depth
  }

  const maximizing = currentPlayer === aiPlayer
  const ordered = orderMoves(moves)

  if (maximizing) {
    let maxEval = -Infinity
    for (const move of ordered) {
      const result = applyMove(
        board,
        move,
        currentPlayer,
        chainCapturePiece,
        rulesVariant,
      )
      if (result.winner === aiPlayer) return MATE_SCORE
      if (result.winner && result.winner !== aiPlayer) return -MATE_SCORE

      const evalScore = minimax(
        result.board,
        depth - 1,
        alpha,
        beta,
        aiPlayer,
        result.currentPlayer,
        result.chainCapturePiece,
        evalStyle,
        rulesVariant,
      )
      maxEval = Math.max(maxEval, evalScore)
      alpha = Math.max(alpha, evalScore)
      if (beta <= alpha) break
    }
    return maxEval
  }

  let minEval = Infinity
  for (const move of ordered) {
    const result = applyMove(
      board,
      move,
      currentPlayer,
      chainCapturePiece,
      rulesVariant,
    )
    if (result.winner === aiPlayer) return MATE_SCORE
    if (result.winner && result.winner !== aiPlayer) return -MATE_SCORE

    const evalScore = minimax(
      result.board,
      depth - 1,
      alpha,
      beta,
      aiPlayer,
      result.currentPlayer,
      result.chainCapturePiece,
      evalStyle,
      rulesVariant,
    )
    minEval = Math.min(minEval, evalScore)
    beta = Math.min(beta, evalScore)
    if (beta <= alpha) break
  }
  return minEval
}

interface ScoredMove {
  move: MoveStep
  score: number
}

function scoreRootMove(
  board: Board,
  move: MoveStep,
  aiPlayer: PlayerId,
  chainCapturePiece: Position | null,
  depth: number,
  evalStyle: BotStyle,
  rulesVariant: RulesVariant = 'STANDARD',
): number {
  const result = applyMove(board, move, aiPlayer, chainCapturePiece, rulesVariant)
  if (result.winner === aiPlayer) return MATE_SCORE
  if (result.winner && result.winner !== aiPlayer) return -MATE_SCORE

  return minimax(
    result.board,
    depth - 1,
    -Infinity,
    Infinity,
    aiPlayer,
    result.currentPlayer,
    result.chainCapturePiece,
    evalStyle,
    rulesVariant,
  )
}

function selectMoveByBot(scored: ScoredMove[], bot: BotProfile): MoveStep {
  if (scored.length === 0) throw new Error('No legal moves')

  scored.sort((a, b) => b.score - a.score)

  if (bot.style === 'casual') {
    if (Math.random() < 0.65) {
      const random = scored[Math.floor(Math.random() * scored.length)]
      return random.move
    }
    const worstPool = scored.slice(-Math.max(2, Math.ceil(scored.length * 0.5)))
    return worstPool[Math.floor(Math.random() * worstPool.length)].move
  }

  if (bot.depth <= 2) {
    const pool = scored.slice(0, Math.min(4, scored.length))
    return pool[Math.floor(Math.random() * pool.length)].move
  }

  if (bot.style === 'perfect' || bot.depth >= 6) {
    return scored[0].move
  }

  const top = scored.slice(0, Math.min(2, scored.length))
  return top[Math.floor(Math.random() * top.length)].move
}

export function findBestMove(
  board: Board,
  aiPlayer: PlayerId,
  bot: BotProfile,
  chainCapturePiece: Position | null = null,
  rulesVariant: RulesVariant = 'STANDARD',
): MoveStep | null {
  const moves = getLegalMoves(board, aiPlayer, chainCapturePiece, rulesVariant)
  if (moves.length === 0) return null

  const scored: ScoredMove[] = orderMoves(moves).map((move) => ({
    move,
    score: scoreRootMove(
      board,
      move,
      aiPlayer,
      chainCapturePiece,
      bot.depth,
      bot.style,
      rulesVariant,
    ),
  }))

  return selectMoveByBot(scored, bot)
}

export async function getAiMoveWithDelay(
  board: Board,
  aiPlayer: PlayerId,
  bot: BotProfile,
  chainCapturePiece: Position | null = null,
  rulesVariant: RulesVariant = 'STANDARD',
): Promise<MoveStep | null> {
  await new Promise<void>((r) => setTimeout(r, bot.thinkDelayMs))
  return findBestMove(board, aiPlayer, bot, chainCapturePiece, rulesVariant)
}

/** Detect if human just missed a mandatory capture (for bot trash-talk). */
export function humanMissedCapture(
  board: Board,
  humanPlayer: PlayerId,
  step: MoveStep,
): boolean {
  const hadCapture = (step.captured?.length ?? 0) > 0
  if (hadCapture) return false
  return hasAnyCapture(board, humanPlayer)
}

export const ANALYSIS_SEARCH_DEPTH = 5

/** Post-game review: score a candidate move from the mover's perspective. */
export function scoreMoveForAnalysis(
  board: Board,
  move: MoveStep,
  mover: PlayerId,
  chainCapturePiece: Position | null,
  depth: number = ANALYSIS_SEARCH_DEPTH,
): number {
  const result = applyMove(board, move, mover, chainCapturePiece)
  if (result.winner === mover) return MATE_SCORE
  if (result.winner && result.winner !== mover) return -MATE_SCORE

  return minimax(
    result.board,
    depth - 1,
    -Infinity,
    Infinity,
    mover,
    result.currentPlayer,
    result.chainCapturePiece,
    'balanced',
  )
}

export interface AnalysisScoredMove {
  move: MoveStep
  score: number
}

/** Rank all legal moves for engine review (depth 5+). */
export function getScoredLegalMoves(
  board: Board,
  player: PlayerId,
  chainCapturePiece: Position | null,
  depth: number = ANALYSIS_SEARCH_DEPTH,
): AnalysisScoredMove[] {
  const moves = getLegalMoves(board, player, chainCapturePiece)
  const scored = orderMoves(moves).map((move) => ({
    move,
    score: scoreMoveForAnalysis(board, move, player, chainCapturePiece, depth),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored
}

export { evaluatePosition as evaluateBoard }
