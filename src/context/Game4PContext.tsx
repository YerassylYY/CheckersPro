import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyMove4P,
  createInitialBoard4P,
  getMovesForPiece4P,
  getPiecesWithLegalMoves4P,
  isEliminated,
} from '../game/engine4p'
import {
  playCapture,
  playKing,
  playMove,
  playSelect,
  playVictory,
} from '../game/sounds'
import type { MoveStep, Player4Id, Position } from '../game/types'

interface Game4PContextValue {
  board: ReturnType<typeof createInitialBoard4P>
  currentPlayer: Player4Id
  mustContinueFrom: Position | null
  winner: Player4Id | null
  eliminated: Player4Id[]
  selected: Position | null
  validMoves: MoveStep[]
  highlightPieces: Position[]
  shakeBoard: boolean
  resetGame: () => void
  selectSquare: (pos: Position) => void
}

const Game4PContext = createContext<Game4PContextValue | null>(null)

export function Game4PProvider({ children }: { children: ReactNode }) {
  const [board, setBoard] = useState(createInitialBoard4P)
  const [currentPlayer, setCurrentPlayer] = useState<Player4Id>(1)
  const [mustContinueFrom, setMustContinueFrom] = useState<Position | null>(null)
  const [winner, setWinner] = useState<Player4Id | null>(null)
  const [selected, setSelected] = useState<Position | null>(null)
  const [shakeBoard, setShakeBoard] = useState(false)
  const [eliminated, setEliminated] = useState<Player4Id[]>([])

  const highlightPieces = useMemo(
    () =>
      winner || isEliminated(board, currentPlayer)
        ? []
        : getPiecesWithLegalMoves4P(board, currentPlayer, mustContinueFrom),
    [board, currentPlayer, mustContinueFrom, winner],
  )

  const validMoves = useMemo(() => {
    if (!selected) return []
    return getMovesForPiece4P(board, currentPlayer, selected, mustContinueFrom)
  }, [board, currentPlayer, selected, mustContinueFrom])

  useEffect(() => {
    if (mustContinueFrom && !winner) {
      setSelected(mustContinueFrom)
    }
  }, [mustContinueFrom, winner])

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard4P())
    setCurrentPlayer(1)
    setMustContinueFrom(null)
    setWinner(null)
    setSelected(null)
    setShakeBoard(false)
    setEliminated([])
  }, [])

  const executeMove = useCallback(
    (step: MoveStep, player: Player4Id) => {
      const caps = step.captured?.length ?? 0
      if (caps > 0) {
        playCapture()
        if (caps > 1 || mustContinueFrom) {
          setShakeBoard(true)
          setTimeout(() => setShakeBoard(false), 150)
        }
      } else {
        playMove()
      }

      const result = applyMove4P(board, step, player)
      setBoard(result.board)
      setCurrentPlayer(result.currentPlayer)
      setMustContinueFrom(result.mustContinueFrom)
      setSelected(result.mustContinueFrom)

      if (result.promoted) playKing()

      setEliminated((prev) => {
        const next = new Set(prev)
        for (let p = 1; p <= 4; p++) {
          const pid = p as Player4Id
          if (isEliminated(result.board, pid)) next.add(pid)
        }
        return [...next]
      })

      if (result.winner) {
        setWinner(result.winner)
        setSelected(null)
        playVictory()
      }
    },
    [board, mustContinueFrom],
  )

  const selectSquare = useCallback(
    (pos: Position) => {
      if (winner || isEliminated(board, currentPlayer)) return

      const movesForSelected = selected
        ? getMovesForPiece4P(board, currentPlayer, selected, mustContinueFrom)
        : []

      const isTarget = movesForSelected.some(
        (m) => m.to.row === pos.row && m.to.col === pos.col,
      )

      if (isTarget && selected) {
        const move = movesForSelected.find(
          (m) => m.to.row === pos.row && m.to.col === pos.col,
        )
        if (move) {
          executeMove(move, currentPlayer)
          return
        }
      }

      if (mustContinueFrom) {
        const chainMoves = getMovesForPiece4P(
          board,
          currentPlayer,
          mustContinueFrom,
          mustContinueFrom,
        )
        const chainTarget = chainMoves.find(
          (m) => m.to.row === pos.row && m.to.col === pos.col,
        )
        if (chainTarget) {
          executeMove(chainTarget, currentPlayer)
        }
        return
      }

      const isHighlight = highlightPieces.some(
        (p) => p.row === pos.row && p.col === pos.col,
      )

      if (isHighlight) {
        setSelected(pos)
        playSelect()
      } else {
        setSelected(null)
      }
    },
    [
      winner,
      board,
      currentPlayer,
      selected,
      mustContinueFrom,
      highlightPieces,
      executeMove,
    ],
  )

  const value: Game4PContextValue = {
    board,
    currentPlayer,
    mustContinueFrom,
    winner,
    eliminated,
    selected,
    validMoves,
    highlightPieces,
    shakeBoard,
    resetGame,
    selectSquare,
  }

  return (
    <Game4PContext.Provider value={value}>{children}</Game4PContext.Provider>
  )
}

export function useGame4P() {
  const ctx = useContext(Game4PContext)
  if (!ctx) throw new Error('useGame4P must be used within Game4PProvider')
  return ctx
}
