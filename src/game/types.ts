/** 0=empty, 1=P1 man, 2=P2 man, 3=P1 king, 4=P2 king */
export type Cell = 0 | 1 | 2 | 3 | 4

export type Board = Cell[][]

export type PlayerId = 1 | 2

export type GameMode = 'local' | 'ai' | 'online' | 'fourPlayer'

/** Core rules variant for 8×8 international checkers. */
export type RulesVariant = 'STANDARD' | 'GIVEAWAY' | 'ATOMIC'

export type AiDifficulty = 'beginner' | 'intermediate' | 'expert'

export interface Position {
  row: number
  col: number
}

export interface MoveStep {
  from: Position
  to: Position
  captured?: Position[]
}

export interface GameMove {
  steps: MoveStep[]
  player: PlayerId
}

export interface MoveResult {
  board: Board
  currentPlayer: PlayerId
  /** Piece that must continue jumping (multi-capture chain). */
  chainCapturePiece: Position | null
  /** @deprecated Use chainCapturePiece */
  mustContinueFrom: Position | null
  winner: PlayerId | null
  promoted: boolean
}

export interface GameState {
  board: Board
  currentPlayer: PlayerId
  chainCapturePiece: Position | null
  mustContinueFrom: Position | null
  winner: PlayerId | null
  moveHistory: GameMove[]
  selected: Position | null
  validMoves: MoveStep[]
  highlightPieces: Position[]
  lastCaptureCount: number
  rulesVariant: RulesVariant
}

export type WinReason = 'capture' | 'block' | 'timeout' | 'resign'

export interface GameEndInfo {
  winner: PlayerId
  reason: WinReason
}

/** 4-player arena: -1 dead, 0 empty, 1/11 white, 2/22 black, 3/33 red, 4/44 blue */
export type Cell4P = number

export type Player4Id = 1 | 2 | 3 | 4

export const PLAYER_NAMES: Record<PlayerId, string> = {
  1: 'White',
  2: 'Black',
}

/** Clockwise: Bottom (White) → Left (Red) → Top (Black) → Right (Blue) */
export const TURN_ORDER_4P: readonly Player4Id[] = [1, 3, 2, 4] as const

export const PLAYER4_NAMES: Record<Player4Id, string> = {
  1: 'White',
  2: 'Black',
  3: 'Red',
  4: 'Blue',
}

export const PLAYER4_SIDE: Record<Player4Id, 'bottom' | 'top' | 'left' | 'right'> = {
  1: 'bottom',
  2: 'top',
  3: 'left',
  4: 'right',
}
