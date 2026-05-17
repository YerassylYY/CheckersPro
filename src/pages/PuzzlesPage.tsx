import { useState } from 'react'
import { Brain, RotateCcw, Check, X } from 'lucide-react'
import {
  TACTICAL_PUZZLES,
  PUZZLE_DIFFICULTY_LABEL,
  type PuzzleDifficulty,
} from '../data/puzzles'
import { PuzzleBoard } from '../components/puzzles/PuzzleBoard'
import { usePuzzleGame } from '../hooks/usePuzzleGame'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'

const FILTERS: Array<PuzzleDifficulty | 'all'> = ['all', 'easy', 'medium', 'hard']

export function PuzzlesPage() {
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [filter, setFilter] = useState<PuzzleDifficulty | 'all'>('all')

  const filtered = TACTICAL_PUZZLES.filter(
    (p) => filter === 'all' || p.difficulty === filter,
  )
  const activeIndex = Math.min(
    puzzleIndex,
    Math.max(0, filtered.length - 1),
  )
  const puzzle = filtered[activeIndex] ?? TACTICAL_PUZZLES[0]

  const game = usePuzzleGame(puzzle)

  const pickPuzzle = (index: number) => {
    setPuzzleIndex(index)
    game.reset()
  }

  const changeFilter = (f: PuzzleDifficulty | 'all') => {
    setFilter(f)
    setPuzzleIndex(0)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <aside className="lg:w-72">
        <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
          <Brain className="text-emerald-400" />
          Tactical Exercises
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Interactive puzzles powered by the live engine — including multi-jumps.
        </p>

        <div className="mt-4 flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => changeFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                filter === f
                  ? 'bg-emerald-800 text-emerald-100'
                  : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {filtered.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => pickPuzzle(i)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  i === activeIndex
                    ? 'border-emerald-700 bg-emerald-950/40 text-emerald-200'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="font-medium">{p.title}</span>
                <span className="ml-2 text-xs text-zinc-600">
                  {PUZZLE_DIFFICULTY_LABEL[p.difficulty]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-zinc-100">{puzzle.title}</h2>
            <p className="text-sm text-zinc-500">{puzzle.hint}</p>
            <p className="mt-1 text-xs text-amber-500/90">
              {PUZZLE_DIFFICULTY_LABEL[puzzle.difficulty]} · Phase{' '}
              {Math.min(game.phaseIndex + 1, puzzle.phases.length)}/
              {puzzle.phases.length}
            </p>
          </div>
          <Button variant="ghost" className="text-xs" onClick={game.reset}>
            <RotateCcw size={14} />
            Reset
          </Button>
        </div>

        <PuzzleBoard
          board={game.board}
          selected={game.selected}
          validMoves={game.validMoves}
          highlightPieces={game.highlightPieces}
          chainCapturePiece={game.chainCapturePiece}
          onSelectSquare={game.selectSquare}
        />

        {game.chainCapturePiece && game.status === 'playing' && (
          <p className="mt-3 text-center text-sm font-medium text-amber-400">
            Continue capturing with the same piece!
          </p>
        )}

        {game.status === 'solved' && (
          <p className="mt-4 flex items-center justify-center gap-2 text-emerald-400">
            <Check size={18} /> Puzzle solved!
          </p>
        )}

        <Button
          className="mt-4 w-full max-w-md"
          variant="secondary"
          onClick={() => {
            const next = (activeIndex + 1) % filtered.length
            pickPuzzle(next)
          }}
        >
          Next puzzle
        </Button>
      </div>

      <Modal
        open={game.status === 'wrong'}
        onClose={game.reset}
        title="Try Again"
        size="md"
      >
        <div className="flex flex-col items-center py-4 text-center">
          <X className="mb-3 h-12 w-12 text-rose-400" />
          <p className="text-sm text-zinc-400">
            That wasn&apos;t the winning move. Study the hint and reset the position.
          </p>
          <Button className="mt-4 w-full" onClick={game.reset}>
            <RotateCcw size={16} />
            Try again
          </Button>
        </div>
      </Modal>
    </div>
  )
}
