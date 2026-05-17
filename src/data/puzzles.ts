import type { Board, Cell, MoveStep, PlayerId } from '../game/types'

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard'

export interface PuzzlePhase {
  playerLine: MoveStep[]
  opponentReply?: MoveStep
}

export interface TacticalPuzzle {
  id: string
  title: string
  difficulty: PuzzleDifficulty
  hint: string
  playerToMove: PlayerId
  initialBoardMatrix: Board
  phases: PuzzlePhase[]
}

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(0) as Cell[])
}

function board(
  pieces: Array<{ row: number; col: number; cell: Cell }>,
): Board {
  const b = emptyBoard()
  for (const { row, col, cell } of pieces) {
    b[row][col] = cell
  }
  return b
}

const hop = (
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  caps: Array<[number, number]> = [],
): MoveStep => ({
  from: { row: fr, col: fc },
  to: { row: tr, col: tc },
  captured: caps.length ? caps.map(([row, col]) => ({ row, col })) : undefined,
})

export const TACTICAL_PUZZLES: TacticalPuzzle[] = [
  // —— Easy: single forced captures ——
  {
    id: 'e1',
    title: 'Snap Capture',
    difficulty: 'easy',
    hint: 'White to move — one jump wins a piece.',
    playerToMove: 1,
    initialBoardMatrix: board([
      { row: 5, col: 4, cell: 1 },
      { row: 4, col: 3, cell: 2 },
    ]),
    phases: [{ playerLine: [hop(5, 4, 3, 2, [[4, 3]])] }],
  },
  {
    id: 'e2',
    title: 'Double Tap',
    difficulty: 'easy',
    hint: 'Same piece jumps twice — do not stop early.',
    playerToMove: 1,
    initialBoardMatrix: board([
      { row: 6, col: 1, cell: 1 },
      { row: 5, col: 2, cell: 2 },
      { row: 3, col: 4, cell: 2 },
    ]),
    phases: [
      {
        playerLine: [
          hop(6, 1, 4, 3, [[5, 2]]),
          hop(4, 3, 2, 5, [[3, 4]]),
        ],
      },
    ],
  },
  {
    id: 'e3',
    title: 'Rear Strike',
    difficulty: 'easy',
    hint: 'Capture backward — international rules allow it.',
    playerToMove: 1,
    initialBoardMatrix: board([
      { row: 2, col: 3, cell: 1 },
      { row: 3, col: 4, cell: 2 },
    ]),
    phases: [{ playerLine: [hop(2, 3, 4, 5, [[3, 4]])] }],
  },
  {
    id: 'e4',
    title: 'Triple Sweep',
    difficulty: 'easy',
    hint: 'Find the three-hop capture line.',
    playerToMove: 1,
    initialBoardMatrix: board([
      { row: 6, col: 4, cell: 1 },
      { row: 5, col: 3, cell: 2 },
      { row: 4, col: 2, cell: 2 },
      { row: 3, col: 1, cell: 2 },
      { row: 1, col: 1, cell: 2 },
    ]),
    phases: [
      {
        playerLine: [
          hop(6, 4, 4, 2, [[5, 3]]),
          hop(4, 2, 2, 0, [[3, 1]]),
          hop(2, 0, 0, 2, [[1, 1]]),
        ],
      },
    ],
  },
  // —— Medium: capture + scripted reply ——
  {
    id: 'm1',
    title: 'Pin & Punish',
    difficulty: 'medium',
    hint: 'Take, let Black reply, then strike again.',
    playerToMove: 1,
    initialBoardMatrix: board([
      { row: 5, col: 4, cell: 1 },
      { row: 4, col: 3, cell: 2 },
      { row: 2, col: 1, cell: 2 },
      { row: 1, col: 0, cell: 1 },
    ]),
    phases: [
      {
        playerLine: [hop(5, 4, 3, 2, [[4, 3]])],
        opponentReply: hop(2, 1, 4, 3, [[3, 2]]),
      },
      {
        playerLine: [hop(1, 0, 3, 2, [[2, 1]])],
      },
    ],
  },
  {
    id: 'm2',
    title: 'Flank Break',
    difficulty: 'medium',
    hint: 'Open with a double, then finish after Black steps aside.',
    playerToMove: 1,
    initialBoardMatrix: board([
      { row: 5, col: 2, cell: 1 },
      { row: 4, col: 3, cell: 2 },
      { row: 4, col: 5, cell: 2 },
      { row: 3, col: 0, cell: 2 },
    ]),
    phases: [
      {
        playerLine: [hop(5, 2, 3, 4, [[4, 3]])],
        opponentReply: hop(3, 0, 4, 1),
      },
      {
        playerLine: [hop(3, 4, 5, 6, [[4, 5]])],
      },
    ],
  },
  {
    id: 'm3',
    title: 'Crown the King',
    difficulty: 'medium',
    hint: 'Promote on the back row, then use the king next turn.',
    playerToMove: 1,
    initialBoardMatrix: board([
      { row: 2, col: 3, cell: 1 },
      { row: 3, col: 4, cell: 2 },
      { row: 1, col: 2, cell: 1 },
      { row: 4, col: 5, cell: 2 },
    ]),
    phases: [
      {
        playerLine: [hop(2, 3, 0, 1, [[3, 4]])],
        opponentReply: hop(4, 5, 3, 4),
      },
      {
        playerLine: [
          {
            from: { row: 0, col: 1 },
            to: { row: 4, col: 5 },
            captured: [{ row: 3, col: 4 }],
          },
        ],
      },
    ],
  },
  // —— Hard: combinations & sacrifices ——
  {
    id: 'h1',
    title: 'Sacrifice Setup',
    difficulty: 'hard',
    hint: 'Give a piece to open a devastating chain.',
    playerToMove: 1,
    initialBoardMatrix: board([
      { row: 5, col: 6, cell: 1 },
      { row: 4, col: 5, cell: 2 },
      { row: 4, col: 3, cell: 1 },
      { row: 3, col: 4, cell: 2 },
      { row: 3, col: 2, cell: 2 },
    ]),
    phases: [
      {
        playerLine: [hop(4, 3, 2, 5, [[3, 4]])],
        opponentReply: hop(4, 5, 2, 3, [[3, 4]]),
      },
      {
        playerLine: [
          hop(5, 6, 3, 5, [[4, 5]]),
          hop(3, 5, 1, 7, [[2, 6]]),
        ],
      },
    ],
  },
  {
    id: 'h2',
    title: 'King’s Revenge',
    difficulty: 'hard',
    hint: 'Promote, then cut with your new king.',
    playerToMove: 1,
    initialBoardMatrix: board([
      { row: 2, col: 5, cell: 1 },
      { row: 3, col: 4, cell: 2 },
      { row: 4, col: 3, cell: 2 },
    ]),
    phases: [
      {
        playerLine: [hop(2, 5, 0, 3, [[3, 4]])],
        opponentReply: hop(4, 3, 3, 2),
      },
      {
        playerLine: [
          {
            from: { row: 0, col: 3 },
            to: { row: 4, col: 7 },
            captured: [{ row: 3, col: 4 }],
          },
        ],
      },
    ],
  },
  {
    id: 'h3',
    title: 'Maximum Violence',
    difficulty: 'hard',
    hint: 'Longest capture sequence — four hops, one piece.',
    playerToMove: 1,
    initialBoardMatrix: board([
      { row: 7, col: 2, cell: 1 },
      { row: 6, col: 3, cell: 2 },
      { row: 5, col: 4, cell: 2 },
      { row: 4, col: 5, cell: 2 },
      { row: 3, col: 6, cell: 2 },
      { row: 2, col: 5, cell: 2 },
    ]),
    phases: [
      {
        playerLine: [
          hop(7, 2, 5, 4, [[6, 3]]),
          hop(5, 4, 3, 6, [[4, 5]]),
          hop(3, 6, 1, 4, [[2, 5]]),
        ],
      },
    ],
  },
  {
    id: 'h4',
    title: 'Grandmaster Finish',
    difficulty: 'hard',
    hint: 'Sacrifice, crown, then a flying king sweep.',
    playerToMove: 1,
    initialBoardMatrix: board([
      { row: 3, col: 2, cell: 1 },
      { row: 4, col: 3, cell: 2 },
      { row: 2, col: 1, cell: 1 },
      { row: 3, col: 4, cell: 2 },
    ]),
    phases: [
      {
        playerLine: [hop(3, 2, 5, 4, [[4, 3]])],
        opponentReply: hop(3, 4, 4, 5),
      },
      {
        playerLine: [hop(2, 1, 0, 3, [[3, 2]])],
      },
    ],
  },
]

export const PUZZLE_DIFFICULTY_LABEL: Record<PuzzleDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}
