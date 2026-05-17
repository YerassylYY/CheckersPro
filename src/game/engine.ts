import type {
  Board,
  Cell,
  MoveResult,
  MoveStep,
  PlayerId,
  Position,
  RulesVariant,
} from './types'

export type { Board, RulesVariant }

export const BOARD_SIZE = 8

/** White promotes on row 0; Black on row 7. */
const PROMOTION_ROW: Record<PlayerId, number> = { 1: 0, 2: BOARD_SIZE - 1 }

const DIAGONALS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const

// ---------------------------------------------------------------------------
// Board primitives
// ---------------------------------------------------------------------------

export function isDarkSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 1
}

export function isPlayable(row: number, col: number): boolean {
  return (
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE &&
    isDarkSquare(row, col)
  )
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row] as Cell[])
}

/** Load a custom 8×8 matrix (puzzles, editors). */
export function createBoardFromMatrix(matrix: Board): Board {
  if (matrix.length !== BOARD_SIZE || matrix.some((r) => r.length !== BOARD_SIZE)) {
    throw new Error('Board matrix must be 8×8')
  }
  return cloneBoard(matrix)
}

export function getOwner(cell: Cell): PlayerId | null {
  if (cell === 0) return null
  if (cell === 1 || cell === 3) return 1
  if (cell === 2 || cell === 4) return 2
  return null
}

export function isKing(cell: Cell): boolean {
  return cell === 3 || cell === 4
}

export function isMan(cell: Cell): boolean {
  return cell === 1 || cell === 2
}

export function promote(cell: Cell): Cell {
  if (cell === 1) return 3
  if (cell === 2) return 4
  return cell
}

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(0) as Cell[],
  )

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!isDarkSquare(row, col)) continue
      if (row < 3) board[row][col] = 2
      else if (row > 4) board[row][col] = 1
    }
  }
  return board
}

function posKey(p: Position): string {
  return `${p.row},${p.col}`
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col
}

function manForwardDirs(player: PlayerId): ReadonlyArray<readonly [number, number]> {
  const dr = player === 1 ? -1 : 1
  return [
    [dr, -1],
    [dr, 1],
  ] as const
}

function cellAfterPromotion(cell: Cell, player: PlayerId, row: number): Cell {
  if (isMan(cell) && row === PROMOTION_ROW[player]) return promote(cell)
  return cell
}

// ---------------------------------------------------------------------------
// Quiet moves
// ---------------------------------------------------------------------------

function getQuietMovesForPiece(
  board: Board,
  row: number,
  col: number,
  player: PlayerId,
): MoveStep[] {
  const cell = board[row][col]
  if (getOwner(cell) !== player) return []

  const from = { row, col }
  const moves: MoveStep[] = []

  if (isMan(cell)) {
    for (const [dr, dc] of manForwardDirs(player)) {
      const nr = row + dr
      const nc = col + dc
      if (isPlayable(nr, nc) && board[nr][nc] === 0) {
        moves.push({ from, to: { row: nr, col: nc } })
      }
    }
    return moves
  }

  for (const [dr, dc] of DIAGONALS) {
    let nr = row + dr
    let nc = col + dc
    while (isPlayable(nr, nc) && board[nr][nc] === 0) {
      moves.push({ from, to: { row: nr, col: nc } })
      nr += dr
      nc += dc
    }
  }
  return moves
}

// ---------------------------------------------------------------------------
// Capture hops (international: men capture in ALL diagonal directions)
// ---------------------------------------------------------------------------

function getManCaptureHops(
  board: Board,
  row: number,
  col: number,
  player: PlayerId,
): MoveStep[] {
  const cell = board[row][col]
  if (!isMan(cell) || getOwner(cell) !== player) return []

  const from = { row, col }
  const hops: MoveStep[] = []

  for (const [dr, dc] of DIAGONALS) {
    const mr = row + dr
    const mc = col + dc
    const lr = row + dr * 2
    const lc = col + dc * 2

    if (!isPlayable(mr, mc) || !isPlayable(lr, lc)) continue
    const mid = board[mr][mc]
    if (mid === 0) continue
    if (getOwner(mid) === player) continue
    if (board[lr][lc] !== 0) continue

    hops.push({
      from,
      to: { row: lr, col: lc },
      captured: [{ row: mr, col: mc }],
    })
  }

  return hops
}

function getKingCaptureHops(
  board: Board,
  row: number,
  col: number,
  player: PlayerId,
): MoveStep[] {
  const cell = board[row][col]
  if (!isKing(cell) || getOwner(cell) !== player) return []

  const from = { row, col }
  const hops: MoveStep[] = []

  for (const [dr, dc] of DIAGONALS) {
    let er = row + dr
    let ec = col + dc
    let enemy: Position | null = null

    while (isPlayable(er, ec)) {
      const target = board[er][ec]

      if (target === 0) {
        er += dr
        ec += dc
        continue
      }

      const owner = getOwner(target)
      if (owner === player) break
      if (enemy !== null) break

      enemy = { row: er, col: ec }

      let lr = er + dr
      let lc = ec + dc
      while (isPlayable(lr, lc) && board[lr][lc] === 0) {
        hops.push({
          from,
          to: { row: lr, col: lc },
          captured: [{ row: enemy.row, col: enemy.col }],
        })
        lr += dr
        lc += dc
      }
      break
    }
  }

  return hops
}

export function getImmediateCapturesForPiece(
  board: Board,
  row: number,
  col: number,
  player: PlayerId,
): MoveStep[] {
  const cell = board[row][col]
  if (getOwner(cell) !== player) return []

  if (isKing(cell)) return getKingCaptureHops(board, row, col, player)
  return getManCaptureHops(board, row, col, player)
}

export function hasAnyCapture(board: Board, player: PlayerId): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (getOwner(board[r][c]) !== player) continue
      if (getImmediateCapturesForPiece(board, r, c, player).length > 0) return true
    }
  }
  return false
}

/**
 * After a capture lands on `landing`, returns that square if the SAME piece
 * must continue jumping; otherwise null (turn may end).
 */
export function detectChainCapture(
  board: Board,
  landing: Position,
  player: PlayerId,
): Position | null {
  const hops = getImmediateCapturesForPiece(
    board,
    landing.row,
    landing.col,
    player,
  )
  return hops.length > 0 ? { row: landing.row, col: landing.col } : null
}

// ---------------------------------------------------------------------------
// Maximum-capture rule
// ---------------------------------------------------------------------------

function countMaxCaptureSequence(
  board: Board,
  row: number,
  col: number,
  player: PlayerId,
  rulesVariant: RulesVariant = 'STANDARD',
): number {
  const hops = getImmediateCapturesForPiece(board, row, col, player)
  if (hops.length === 0) return 0

  let max = 0
  for (const hop of hops) {
    const { board: next, jumperAlive } = resolveCaptureStep(
      board,
      hop,
      player,
      rulesVariant,
    )
    if (rulesVariant === 'ATOMIC' && !jumperAlive) {
      max = Math.max(max, 1)
      continue
    }
    const total =
      1 + countMaxCaptureSequence(next, hop.to.row, hop.to.col, player, rulesVariant)
    if (total > max) max = total
  }
  return max
}

function getGlobalMaxCaptureCount(
  board: Board,
  player: PlayerId,
  rulesVariant: RulesVariant = 'STANDARD',
): number {
  let max = 0
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (getOwner(board[r][c]) !== player) continue
      const n = countMaxCaptureSequence(board, r, c, player, rulesVariant)
      if (n > max) max = n
    }
  }
  return max
}

function hopAchievesMaxCapture(
  board: Board,
  hop: MoveStep,
  player: PlayerId,
  globalMax: number,
  rulesVariant: RulesVariant = 'STANDARD',
): boolean {
  const { board: next } = simulateCaptureHop(board, hop, player, rulesVariant)
  const remaining = countMaxCaptureSequence(next, hop.to.row, hop.to.col, player)
  return 1 + remaining === globalMax
}

const BLAST_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const

/** Obliterates neighbors of `center`; kings survive unless directly captured. */
function applyAtomicBlast(
  board: Board,
  center: Position,
  directCaptureKeys: Set<string>,
): Board {
  const next = cloneBoard(board)
  for (const [dr, dc] of BLAST_OFFSETS) {
    const r = center.row + dr
    const c = center.col + dc
    if (!isPlayable(r, c)) continue
    const cell = next[r][c]
    if (cell === 0) continue
    if (isKing(cell) && !directCaptureKeys.has(posKey({ row: r, col: c }))) continue
    next[r][c] = 0
  }
  return next
}

function resolveCaptureStep(
  board: Board,
  hop: MoveStep,
  player: PlayerId,
  rulesVariant: RulesVariant,
): { board: Board; promoted: boolean; jumperAlive: boolean } {
  let next = cloneBoard(board)
  const cell = next[hop.from.row][hop.from.col]
  next[hop.from.row][hop.from.col] = 0

  const directKeys = new Set((hop.captured ?? []).map(posKey))

  for (const cap of hop.captured ?? []) {
    next[cap.row][cap.col] = 0
  }

  if (rulesVariant === 'ATOMIC') {
    for (const cap of hop.captured ?? []) {
      next = applyAtomicBlast(next, cap, directKeys)
    }
  }

  const landed = cellAfterPromotion(cell, player, hop.to.row)
  next[hop.to.row][hop.to.col] = landed
  const promoted = landed !== cell && isKing(landed)
  const atDest = next[hop.to.row][hop.to.col]
  const jumperAlive = atDest !== 0 && getOwner(atDest) === player

  return { board: next, promoted, jumperAlive }
}

function simulateCaptureHop(
  board: Board,
  hop: MoveStep,
  player: PlayerId,
  rulesVariant: RulesVariant = 'STANDARD',
): { board: Board; promoted: boolean } {
  const { board: next, promoted } = resolveCaptureStep(
    board,
    hop,
    player,
    rulesVariant,
  )
  return { board: next, promoted }
}

function simulateQuietStep(
  board: Board,
  step: MoveStep,
  player: PlayerId,
): { board: Board; promoted: boolean } {
  const next = cloneBoard(board)
  const cell = next[step.from.row][step.from.col]
  next[step.from.row][step.from.col] = 0
  const landed = cellAfterPromotion(cell, player, step.to.row)
  next[step.to.row][step.to.col] = landed
  return { board: next, promoted: landed !== cell && isKing(landed) }
}

// ---------------------------------------------------------------------------
// Legal move generation
// ---------------------------------------------------------------------------

function getAllImmediateCaptures(board: Board, player: PlayerId): MoveStep[] {
  const hops: MoveStep[] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (getOwner(board[r][c]) !== player) continue
      hops.push(...getImmediateCapturesForPiece(board, r, c, player))
    }
  }
  return hops
}

function getAllQuietMoves(board: Board, player: PlayerId): MoveStep[] {
  const moves: MoveStep[] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (getOwner(board[r][c]) !== player) continue
      moves.push(...getQuietMovesForPiece(board, r, c, player))
    }
  }
  return moves
}

/**
 * Legal moves for the active player.
 * During a chain (`chainCapturePiece`), only immediate jumps for that piece.
 */
export function getLegalMoves(
  board: Board,
  player: PlayerId,
  chainCapturePiece: Position | null,
  rulesVariant: RulesVariant = 'STANDARD',
): MoveStep[] {
  if (chainCapturePiece) {
    const { row, col } = chainCapturePiece
    return getImmediateCapturesForPiece(board, row, col, player)
  }

  if (hasAnyCapture(board, player)) {
    const globalMax = getGlobalMaxCaptureCount(board, player, rulesVariant)
    return getAllImmediateCaptures(board, player).filter((hop) =>
      hopAchievesMaxCapture(board, hop, player, globalMax, rulesVariant),
    )
  }

  return getAllQuietMoves(board, player)
}

export function getPiecesWithLegalMoves(
  board: Board,
  player: PlayerId,
  chainCapturePiece: Position | null,
  rulesVariant: RulesVariant = 'STANDARD',
): Position[] {
  if (chainCapturePiece) return [chainCapturePiece]

  const moves = getLegalMoves(board, player, null, rulesVariant)
  const seen = new Set<string>()
  const pieces: Position[] = []

  for (const m of moves) {
    const key = posKey(m.from)
    if (!seen.has(key)) {
      seen.add(key)
      pieces.push(m.from)
    }
  }
  return pieces
}

export function getMovesForPiece(
  board: Board,
  player: PlayerId,
  from: Position,
  chainCapturePiece: Position | null,
  rulesVariant: RulesVariant = 'STANDARD',
): MoveStep[] {
  if (chainCapturePiece && !positionsEqual(chainCapturePiece, from)) return []

  return getLegalMoves(board, player, chainCapturePiece, rulesVariant).filter(
    (m) => positionsEqual(m.from, from),
  )
}

export function stepsEqual(a: MoveStep, b: MoveStep): boolean {
  return (
    positionsEqual(a.from, b.from) &&
    positionsEqual(a.to, b.to)
  )
}

// ---------------------------------------------------------------------------
// Apply moves
// ---------------------------------------------------------------------------

export function applyCaptureStep(
  board: Board,
  step: MoveStep,
  player: PlayerId,
  rulesVariant: RulesVariant = 'STANDARD',
): { board: Board; promoted: boolean } {
  return simulateCaptureHop(board, step, player, rulesVariant)
}

export function applyQuietStep(
  board: Board,
  step: MoveStep,
  player: PlayerId,
): { board: Board; promoted: boolean } {
  return simulateQuietStep(board, step, player)
}

/** @deprecated Use applyCaptureStep / applyQuietStep */
export function applyMoveStep(
  board: Board,
  step: MoveStep,
  player: PlayerId,
): { board: Board; promoted: boolean } {
  const isCapture = (step.captured?.length ?? 0) > 0
  return isCapture
    ? applyCaptureStep(board, step, player)
    : applyQuietStep(board, step, player)
}

export function applyMove(
  board: Board,
  step: MoveStep,
  player: PlayerId,
  _chainCapturePiece: Position | null,
  rulesVariant: RulesVariant = 'STANDARD',
): MoveResult {
  const isCapture = (step.captured?.length ?? 0) > 0
  let newBoard: Board
  let promoted: boolean
  let jumperAlive = true

  if (isCapture) {
    const resolved = resolveCaptureStep(board, step, player, rulesVariant)
    newBoard = resolved.board
    promoted = resolved.promoted
    jumperAlive = resolved.jumperAlive
  } else {
    const quiet = applyQuietStep(board, step, player)
    newBoard = quiet.board
    promoted = quiet.promoted
  }

  const chainCapturePiece =
    isCapture && jumperAlive
      ? detectChainCapture(newBoard, step.to, player)
      : null

  const turnContinues = chainCapturePiece !== null
  const nextPlayer: PlayerId = turnContinues ? player : player === 1 ? 2 : 1
  const winner = !turnContinues
    ? checkWinner(newBoard, nextPlayer, rulesVariant)
    : null

  return {
    board: newBoard,
    currentPlayer: turnContinues ? player : nextPlayer,
    chainCapturePiece,
    mustContinueFrom: chainCapturePiece,
    winner,
    promoted,
  }
}

function countPieces(board: Board, player: PlayerId): number {
  let n = 0
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (getOwner(board[r][c]) === player) n++
    }
  }
  return n
}

export function checkWinner(
  board: Board,
  nextPlayer: PlayerId,
  rulesVariant: RulesVariant = 'STANDARD',
): PlayerId | null {
  if (rulesVariant === 'GIVEAWAY') {
    if (countPieces(board, 1) === 0) return 1
    if (countPieces(board, 2) === 0) return 2
    if (getLegalMoves(board, nextPlayer, null, rulesVariant).length === 0) {
      return nextPlayer
    }
    return null
  }

  if (countPieces(board, 1) === 0) return 2
  if (countPieces(board, 2) === 0) return 1
  if (getLegalMoves(board, nextPlayer, null, rulesVariant).length === 0) {
    return nextPlayer === 1 ? 2 : 1
  }
  return null
}

export function boardToKey(board: Board): string {
  return board.map((r) => r.join('')).join('/')
}

export function serializeMove(step: MoveStep, player: PlayerId): string {
  return `${player}:${step.from.row},${step.from.col}->${step.to.row},${step.to.col}`
}
