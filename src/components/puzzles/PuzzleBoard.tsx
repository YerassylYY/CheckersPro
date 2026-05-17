import { isDarkSquare } from '../../game/engine'
import { CheckerPiece } from '../board/CheckerPiece'
import type { Board, MoveStep, Position } from '../../game/types'

interface PuzzleBoardProps {
  board: Board
  selected: Position | null
  validMoves: MoveStep[]
  highlightPieces: Position[]
  chainCapturePiece: Position | null
  onSelectSquare: (pos: Position) => void
}

export function PuzzleBoard({
  board,
  selected,
  validMoves,
  highlightPieces,
  chainCapturePiece,
  onSelectSquare,
}: PuzzleBoardProps) {
  const isSelected = (r: number, c: number) =>
    selected?.row === r && selected?.col === c

  const isHighlightPiece = (r: number, c: number) =>
    highlightPieces.some((p) => p.row === r && p.col === c)

  const isMoveTarget = (r: number, c: number) =>
    validMoves.some((m) => m.to.row === r && m.to.col === c)

  const isCaptureTarget = (r: number, c: number) => {
    const move = validMoves.find((m) => m.to.row === r && m.to.col === c)
    return (move?.captured?.length ?? 0) > 0
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="board-frame rounded-sm border-4 p-1 shadow-lg">
        <div
          className="grid aspect-square grid-cols-8 gap-0 overflow-hidden rounded-sm border border-black/20"
          role="grid"
          aria-label="Puzzle board"
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const dark = isDarkSquare(r, c)
              const pos = { row: r, col: c }
              const moveTarget = isMoveTarget(r, c)
              const captureTarget =
                selected && moveTarget && isCaptureTarget(r, c)
              const chainSquare =
                chainCapturePiece?.row === r && chainCapturePiece?.col === c
              const canTap =
                dark &&
                (cell !== 0 ||
                  moveTarget ||
                  isHighlightPiece(r, c) ||
                  chainSquare)

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  disabled={!canTap}
                  onClick={() => canTap && onSelectSquare(pos)}
                  title={chainSquare ? 'Must Jump Now!' : undefined}
                  className={[
                    'relative flex aspect-square items-center justify-center touch-manipulation transition-colors',
                    dark ? 'board-square-dark' : 'board-square-light',
                    !dark && 'cursor-default',
                    dark && canTap && 'hover:brightness-95 cursor-pointer',
                    captureTarget && 'ring-2 ring-rose-500 ring-inset',
                    chainSquare &&
                      !isSelected(r, c) &&
                      'ring-2 ring-amber-500/80 ring-inset',
                    isSelected(r, c) && 'ring-2 ring-amber-500 ring-inset',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {moveTarget && cell === 0 && (
                    <span
                      className="h-4 w-4 rounded-full bg-emerald-500/40"
                      aria-hidden
                    />
                  )}
                  {cell !== 0 && (
                    <CheckerPiece
                      cell={cell}
                      selected={isSelected(r, c)}
                      highlight={isHighlightPiece(r, c) && !isSelected(r, c)}
                    />
                  )}
                </button>
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}
