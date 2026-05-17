import { isDarkSquare } from '../../../game/engine'
import { CheckerPiece } from '../../board/CheckerPiece'
import type { Board } from '../../../game/types'

interface ReviewMiniBoardProps {
  board: Board
  highlight?: { row: number; col: number } | null
}

export function ReviewMiniBoard({ board, highlight }: ReviewMiniBoardProps) {
  return (
    <div className="mx-auto w-full max-w-[220px] rounded border-2 border-zinc-700 bg-zinc-800 p-0.5">
      <div className="grid aspect-square grid-cols-8 gap-0 overflow-hidden">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const dark = isDarkSquare(r, c)
            const isHl = highlight?.row === r && highlight?.col === c
            return (
              <div
                key={`${r}-${c}`}
                className={[
                  'relative flex aspect-square items-center justify-center',
                  dark ? 'board-square-dark' : 'board-square-light',
                  isHl && 'ring-2 ring-amber-400 ring-inset',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {cell !== 0 && (
                  <CheckerPiece cell={cell} size="sm" selected={isHl} />
                )}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
