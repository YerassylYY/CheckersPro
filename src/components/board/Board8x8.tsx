import { isDarkSquare } from '../../game/engine'
import { useGame } from '../../context/GameContext'
import { usePreferences } from '../../context/PreferencesContext'
import { useStore } from '../../context/StoreContext'
import { CheckerPiece } from './CheckerPiece'

export function Board8x8() {
  const {
    board,
    selected,
    validMoves,
    highlightPieces,
    selectSquare,
    shakeBoard,
    mustContinueFrom,
    isAiThinking,
    mode,
    currentPlayer,
    aiPlayer,
    rulesVariant,
  } = useGame()
  const { kidsMode } = usePreferences()
  const { activeSkin } = useStore()

  const inputLocked =
    isAiThinking || (mode === 'ai' && currentPlayer === aiPlayer)

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
    <div className="flex w-full justify-center px-2">
      <div
        className={`w-full max-w-[min(100vw-1.5rem,28rem)] ${shakeBoard ? 'animate-board-shake' : ''} ${inputLocked ? 'pointer-events-none opacity-90' : ''}`}
        title={kidsMode && mustContinueFrom ? 'Must Jump Now!' : undefined}
      >
        <div
          className={`board-frame rounded-sm border-4 p-1 shadow-lg sm:p-1.5 ${activeSkin.frameClass ?? ''}`}
        >
          <div
            className={`board-skin-grid grid aspect-square w-full grid-cols-8 gap-0 overflow-hidden rounded-sm border border-black/20 ${activeSkin.gridClass ?? ''} ${rulesVariant === 'ATOMIC' ? 'ring-1 ring-rose-900/30' : ''}`}
            role="grid"
            aria-label="Checkers board"
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const dark = isDarkSquare(r, c)
                const pos = { row: r, col: c }
                const moveTarget = isMoveTarget(r, c)
                const captureTarget =
                  selected && moveTarget && isCaptureTarget(r, c)
                const chainSquare =
                  mustContinueFrom?.row === r && mustContinueFrom?.col === c
                const canTap = dark && (cell !== 0 || moveTarget)

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    disabled={!canTap && !dark}
                    onClick={() => dark && selectSquare(pos)}
                    title={
                      kidsMode && chainSquare
                        ? 'Must Jump Now!'
                        : kidsMode && captureTarget
                          ? 'Jump here!'
                          : undefined
                    }
                    className={[
                      'relative flex aspect-square items-center justify-center',
                      'touch-manipulation transition-colors duration-150',
                      dark ? 'board-square-dark' : 'board-square-light',
                      !dark && 'cursor-default',
                      dark && canTap && 'hover:brightness-95',
                      captureTarget && 'ring-2 ring-rose-500 ring-inset',
                      chainSquare &&
                        !isSelected(r, c) &&
                        'ring-2 ring-amber-500/80 ring-inset',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-label={`Square ${r + 1}, ${c + 1}`}
                  >
                    {moveTarget && !cell && (
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
    </div>
  )
}
