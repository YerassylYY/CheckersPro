import {
  BOARD_4P_SIZE,
  DEAD_CELL,
  isDeadZone,
  isPlayable4P,
} from '../../game/engine4p'
import { useGame4P } from '../../context/Game4PContext'
import { useStore } from '../../context/StoreContext'
import { CheckerPiece4P } from './CheckerPiece4P'


export function Board4P() {
  const {
    board,
    selected,
    validMoves,
    highlightPieces,
    selectSquare,
    shakeBoard,
    mustContinueFrom,
  } = useGame4P()
  const { activeSkin } = useStore()

  const isHighlightPiece = (row: number, col: number) =>
    highlightPieces.some((p) => p.row === row && p.col === col)

  const isSelected = (row: number, col: number) =>
    selected?.row === row && selected?.col === col

  const isMoveTarget = (row: number, col: number) =>
    validMoves.some((m) => m.to.row === row && m.to.col === col)

  const isCaptureTarget = (row: number, col: number) => {
    const move = validMoves.find((m) => m.to.row === row && m.to.col === col)
    return (move?.captured?.length ?? 0) > 0
  }

  return (
    <div className="flex w-full justify-center px-1">
      <div
        className={`w-full max-w-[min(100vw-0.75rem,32rem)] ${shakeBoard ? 'animate-board-shake' : ''}`}
      >
        <div
          className={`board-frame rounded-sm border-4 p-0.5 shadow-lg sm:p-1 ${activeSkin.frameClass ?? ''}`}
        >
          <div
            className={`board-skin-grid grid aspect-square w-full gap-0 overflow-hidden rounded-sm border border-black/20 ${activeSkin.gridClass ?? ''}`}
            style={{
              gridTemplateColumns: `repeat(${BOARD_4P_SIZE}, minmax(0, 1fr))`,
            }}
            role="grid"
            aria-label="Four-player checkers arena"
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const dead = isDeadZone(r, c) || cell === DEAD_CELL
                const playable = isPlayable4P(r, c)
                const pos = { row: r, col: c }
                const moveTarget = isMoveTarget(r, c)
                const captureTarget =
                  selected && moveTarget && isCaptureTarget(r, c)
                const chainSquare =
                  mustContinueFrom?.row === r && mustContinueFrom?.col === c
                const hasPiece = cell > 0
                const canTap = playable && (hasPiece || moveTarget)

                if (dead) {
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="aspect-square bg-zinc-950 cursor-default"
                      aria-hidden
                    />
                  )
                }

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    disabled={!canTap && !playable}
                    onClick={() => playable && selectSquare(pos)}
                    className={[
                      'relative flex aspect-square items-center justify-center touch-manipulation transition-colors duration-150',
                      playable ? 'board-square-dark' : 'board-square-light',
                      canTap && playable && 'hover:brightness-95',
                      captureTarget && 'ring-2 ring-rose-500 ring-inset',
                      chainSquare &&
                        !isSelected(r, c) &&
                        'ring-2 ring-amber-500/80 ring-inset',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {moveTarget && !hasPiece && (
                      <span
                        className="h-3 w-3 rounded-full bg-emerald-500/40 sm:h-4 sm:w-4"
                        aria-hidden
                      />
                    )}
                    {hasPiece && (
                      <CheckerPiece4P
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
    </div>
  )
}
