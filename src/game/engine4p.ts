import { TURN_ORDER_4P, type Cell4P, type MoveStep, type Player4Id, type Position } from './types'

export type { Cell4P }
export type Board4P = Cell4P[][]

export const BOARD_4P_SIZE = 12
export const DEAD_CELL = -1
export const EMPTY = 0

const MAN: Record<Player4Id, number> = { 1: 1, 2: 2, 3: 3, 4: 4 }
const KING: Record<Player4Id, number> = { 1: 11, 2: 22, 3: 33, 4: 44 }

const DIAGONALS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const

// ---------------------------------------------------------------------------
// Board geometry — 12×12 cross, 3×3 corners are dead (-1)
// ---------------------------------------------------------------------------

export function isDeadZone(row: number, col: number): boolean {
  if (row < 0 || row >= BOARD_4P_SIZE || col < 0 || col >= BOARD_4P_SIZE) return true
  if (row < 3 && col < 3) return true
  if (row < 3 && col > 8) return true
  if (row > 8 && col < 3) return true
  if (row > 8 && col > 8) return true
  return false
}

export function isDarkSquare4P(row: number, col: number): boolean {
  return (row + col) % 2 === 1
}

/** Playable dark square on the cross (not dead). */
export function isPlayable4P(row: number, col: number): boolean {
  return !isDeadZone(row, col) && isDarkSquare4P(row, col)
}

export function cloneBoard4P(board: Board4P): Board4P {
  return board.map((row) => [...row])
}

// ---------------------------------------------------------------------------
// Piece helpers
// ---------------------------------------------------------------------------

export function getOwner4P(cell: Cell4P): Player4Id | null {
  if (cell <= 0) return null
  for (const p of TURN_ORDER_4P) {
    if (cell === MAN[p] || cell === KING[p]) return p
  }
  return null
}

export function isKing4P(cell: Cell4P): boolean {
  return cell === 11 || cell === 22 || cell === 33 || cell === 44
}

export function isMan4P(cell: Cell4P): boolean {
  return cell >= 1 && cell <= 4
}

export function promote4P(cell: Cell4P, player: Player4Id): Cell4P {
  if (cell === MAN[player]) return KING[player]
  return cell
}

function isEmpty(cell: Cell4P): boolean {
  return cell === EMPTY
}

function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col
}

/** Opposite arm of the cross for promotion. */
function isPromotionSquare(player: Player4Id, row: number, col: number): boolean {
  if (!isPlayable4P(row, col)) return false
  switch (player) {
    case 1:
      return row < 3 && col >= 3 && col <= 8
    case 2:
      return row > 8 && col >= 3 && col <= 8
    case 3:
      return col > 8 && row >= 3 && row <= 8
    case 4:
      return col < 3 && row >= 3 && row <= 8
    default:
      return false
  }
}

function cellAfterLanding(cell: Cell4P, player: Player4Id, row: number, col: number): Cell4P {
  if (isMan4P(cell) && isPromotionSquare(player, row, col)) {
    return promote4P(cell, player)
  }
  return cell
}

/** Forward diagonal steps for men. */
function manForwardDirs(player: Player4Id): ReadonlyArray<readonly [number, number]> {
  switch (player) {
    case 1:
      return [
        [-1, -1],
        [-1, 1],
      ] as const
    case 2:
      return [
        [1, -1],
        [1, 1],
      ] as const
    case 3:
      return [
        [-1, 1],
        [1, 1],
      ] as const
    case 4:
      return [
        [-1, -1],
        [1, -1],
      ] as const
    default:
      return []
  }
}

// ---------------------------------------------------------------------------
// Initial board
// ---------------------------------------------------------------------------

export function createInitialBoard4P(): Board4P {
  const board: Board4P = Array.from({ length: BOARD_4P_SIZE }, (_, row) =>
    Array.from({ length: BOARD_4P_SIZE }, (_, col) => {
      if (isDeadZone(row, col)) return DEAD_CELL
      return EMPTY
    }),
  )

  for (let row = 0; row < BOARD_4P_SIZE; row++) {
    for (let col = 0; col < BOARD_4P_SIZE; col++) {
      if (!isPlayable4P(row, col)) continue

      if (row > 8) board[row][col] = MAN[1]
      else if (row < 3) board[row][col] = MAN[2]
      else if (col < 3) board[row][col] = MAN[3]
      else if (col > 8) board[row][col] = MAN[4]
    }
  }

  return board
}

// ---------------------------------------------------------------------------
// Turn cycle & elimination
// ---------------------------------------------------------------------------

export function countPieces4P(board: Board4P, player: Player4Id): number {
  let n = 0
  for (let r = 0; r < BOARD_4P_SIZE; r++) {
    for (let c = 0; c < BOARD_4P_SIZE; c++) {
      if (getOwner4P(board[r][c]) === player) n++
    }
  }
  return n
}

export function isEliminated(board: Board4P, player: Player4Id): boolean {
  return countPieces4P(board, player) === 0
}

export function getActivePlayers(board: Board4P): Player4Id[] {
  return TURN_ORDER_4P.filter((p) => !isEliminated(board, p))
}

export function nextPlayerClockwise(current: Player4Id): Player4Id {
  const idx = TURN_ORDER_4P.indexOf(current)
  return TURN_ORDER_4P[(idx + 1) % TURN_ORDER_4P.length]
}

export function nextActivePlayer(board: Board4P, current: Player4Id): Player4Id {
  let next = nextPlayerClockwise(current)
  let guard = 0
  while (isEliminated(board, next) && guard < 4) {
    next = nextPlayerClockwise(next)
    guard++
  }
  return next
}

export function checkWinner4P(board: Board4P): Player4Id | null {
  const alive = getActivePlayers(board)
  if (alive.length === 1) return alive[0]
  return null
}

// ---------------------------------------------------------------------------
// Quiet moves & single-hop captures
// ---------------------------------------------------------------------------

function getQuietMovesForPiece(
  board: Board4P,
  row: number,
  col: number,
  player: Player4Id,
): MoveStep[] {
  const cell = board[row][col]
  if (getOwner4P(cell) !== player) return []
  const from = { row, col }
  const moves: MoveStep[] = []

  if (isMan4P(cell)) {
    for (const [dr, dc] of manForwardDirs(player)) {
      const nr = row + dr
      const nc = col + dc
      if (isPlayable4P(nr, nc) && isEmpty(board[nr][nc])) {
        moves.push({ from, to: { row: nr, col: nc } })
      }
    }
    return moves
  }

  for (const [dr, dc] of DIAGONALS) {
    let nr = row + dr
    let nc = col + dc
    while (isPlayable4P(nr, nc) && isEmpty(board[nr][nc])) {
      moves.push({ from, to: { row: nr, col: nc } })
      nr += dr
      nc += dc
    }
  }
  return moves
}

function getManCaptureHops(
  board: Board4P,
  row: number,
  col: number,
  player: Player4Id,
): MoveStep[] {
  const cell = board[row][col]
  if (!isMan4P(cell) || getOwner4P(cell) !== player) return []

  const from = { row, col }
  const hops: MoveStep[] = []

  for (const [dr, dc] of manForwardDirs(player)) {
    const mr = row + dr
    const mc = col + dc
    const lr = row + dr * 2
    const lc = col + dc * 2

    if (!isPlayable4P(mr, mc) || !isPlayable4P(lr, lc)) continue
    const mid = board[mr][mc]
    if (isEmpty(mid) || getOwner4P(mid) === player) continue
    if (!isEmpty(board[lr][lc])) continue

    hops.push({
      from,
      to: { row: lr, col: lc },
      captured: [{ row: mr, col: mc }],
    })
  }
  return hops
}

function getKingCaptureHops(
  board: Board4P,
  row: number,
  col: number,
  player: Player4Id,
): MoveStep[] {
  const cell = board[row][col]
  if (!isKing4P(cell) || getOwner4P(cell) !== player) return []

  const from = { row, col }
  const hops: MoveStep[] = []

  for (const [dr, dc] of DIAGONALS) {
    let er = row + dr
    let ec = col + dc
    let enemy: Position | null = null

    while (isPlayable4P(er, ec)) {
      const target = board[er][ec]
      if (isEmpty(target)) {
        er += dr
        ec += dc
        continue
      }
      if (getOwner4P(target) === player) break
      if (enemy) break

      enemy = { row: er, col: ec }
      let lr = er + dr
      let lc = ec + dc
      while (isPlayable4P(lr, lc) && isEmpty(board[lr][lc])) {
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
  board: Board4P,
  row: number,
  col: number,
  player: Player4Id,
): MoveStep[] {
  const cell = board[row][col]
  if (getOwner4P(cell) !== player) return []
  if (isKing4P(cell)) return getKingCaptureHops(board, row, col, player)
  return getManCaptureHops(board, row, col, player)
}

export function hasAnyCapture4P(board: Board4P, player: Player4Id): boolean {
  for (let r = 0; r < BOARD_4P_SIZE; r++) {
    for (let c = 0; c < BOARD_4P_SIZE; c++) {
      if (getOwner4P(board[r][c]) !== player) continue
      if (getImmediateCapturesForPiece(board, r, c, player).length > 0) return true
    }
  }
  return false
}

function simulateHop(
  board: Board4P,
  hop: MoveStep,
  player: Player4Id,
): { board: Board4P; promoted: boolean } {
  const next = cloneBoard4P(board)
  const cell = next[hop.from.row][hop.from.col]
  next[hop.from.row][hop.from.col] = EMPTY

  for (const cap of hop.captured ?? []) {
    next[cap.row][cap.col] = EMPTY
  }

  const landed = cellAfterLanding(cell, player, hop.to.row, hop.to.col)
  next[hop.to.row][hop.to.col] = landed
  return { board: next, promoted: landed !== cell && isKing4P(landed) }
}

function countMaxCaptureSequence(
  board: Board4P,
  row: number,
  col: number,
  player: Player4Id,
): number {
  const hops = getImmediateCapturesForPiece(board, row, col, player)
  if (hops.length === 0) return 0

  let max = 0
  for (const hop of hops) {
    const { board: next } = simulateHop(board, hop, player)
    const total = 1 + countMaxCaptureSequence(next, hop.to.row, hop.to.col, player)
    if (total > max) max = total
  }
  return max
}

function getGlobalMaxCaptureCount(board: Board4P, player: Player4Id): number {
  let max = 0
  for (let r = 0; r < BOARD_4P_SIZE; r++) {
    for (let c = 0; c < BOARD_4P_SIZE; c++) {
      if (getOwner4P(board[r][c]) !== player) continue
      const n = countMaxCaptureSequence(board, r, c, player)
      if (n > max) max = n
    }
  }
  return max
}

function hopAchievesMaxCapture(
  board: Board4P,
  hop: MoveStep,
  player: Player4Id,
  globalMax: number,
): boolean {
  const { board: next } = simulateHop(board, hop, player)
  const remaining = countMaxCaptureSequence(next, hop.to.row, hop.to.col, player)
  return 1 + remaining === globalMax
}

function getAllImmediateCaptures(board: Board4P, player: Player4Id): MoveStep[] {
  const hops: MoveStep[] = []
  for (let r = 0; r < BOARD_4P_SIZE; r++) {
    for (let c = 0; c < BOARD_4P_SIZE; c++) {
      if (getOwner4P(board[r][c]) !== player) continue
      hops.push(...getImmediateCapturesForPiece(board, r, c, player))
    }
  }
  return hops
}

function getAllQuietMoves(board: Board4P, player: Player4Id): MoveStep[] {
  const moves: MoveStep[] = []
  for (let r = 0; r < BOARD_4P_SIZE; r++) {
    for (let c = 0; c < BOARD_4P_SIZE; c++) {
      if (getOwner4P(board[r][c]) !== player) continue
      moves.push(...getQuietMovesForPiece(board, r, c, player))
    }
  }
  return moves
}

// ---------------------------------------------------------------------------
// Public move API
// ---------------------------------------------------------------------------

export function getLegalMoves4P(
  board: Board4P,
  player: Player4Id,
  mustContinueFrom: Position | null,
): MoveStep[] {
  if (isEliminated(board, player)) return []

  if (mustContinueFrom) {
    const { row, col } = mustContinueFrom
    return getImmediateCapturesForPiece(board, row, col, player)
  }

  if (hasAnyCapture4P(board, player)) {
    const globalMax = getGlobalMaxCaptureCount(board, player)
    return getAllImmediateCaptures(board, player).filter((hop) =>
      hopAchievesMaxCapture(board, hop, player, globalMax),
    )
  }

  return getAllQuietMoves(board, player)
}

export function getPiecesWithLegalMoves4P(
  board: Board4P,
  player: Player4Id,
  mustContinueFrom: Position | null,
): Position[] {
  if (mustContinueFrom) return [mustContinueFrom]

  const moves = getLegalMoves4P(board, player, null)
  const seen = new Set<string>()
  const pieces: Position[] = []

  for (const m of moves) {
    const key = `${m.from.row},${m.from.col}`
    if (!seen.has(key)) {
      seen.add(key)
      pieces.push(m.from)
    }
  }
  return pieces
}

export function getMovesForPiece4P(
  board: Board4P,
  player: Player4Id,
  from: Position,
  mustContinueFrom: Position | null,
): MoveStep[] {
  if (mustContinueFrom && !positionsEqual(mustContinueFrom, from)) return []

  return getLegalMoves4P(board, player, mustContinueFrom).filter((m) =>
    positionsEqual(m.from, from),
  )
}

export function applyMove4P(
  board: Board4P,
  step: MoveStep,
  player: Player4Id,
): {
  board: Board4P
  mustContinueFrom: Position | null
  currentPlayer: Player4Id
  promoted: boolean
  winner: Player4Id | null
} {
  const { board: newBoard, promoted } = simulateHop(board, step, player)
  const hadCapture = (step.captured?.length ?? 0) > 0

  let continueFrom: Position | null = null
  if (hadCapture) {
    const further = getImmediateCapturesForPiece(
      newBoard,
      step.to.row,
      step.to.col,
      player,
    )
    if (further.length > 0) continueFrom = { row: step.to.row, col: step.to.col }
  }

  let currentPlayer = player
  if (!continueFrom) {
    currentPlayer = nextActivePlayer(newBoard, player)
  }

  const winner = checkWinner4P(newBoard)

  return {
    board: newBoard,
    mustContinueFrom: continueFrom,
    currentPlayer,
    promoted,
    winner,
  }
}

/** @deprecated use isPlayable4P */
export function isValidCell4P(row: number, col: number): boolean {
  return isPlayable4P(row, col)
}
