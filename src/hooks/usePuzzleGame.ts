import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  applyMove,
  createBoardFromMatrix,
  getMovesForPiece,
  getPiecesWithLegalMoves,
  stepsEqual,
} from '../game/engine'
import type { TacticalPuzzle } from '../data/puzzles'
import type { Board, MoveStep, PlayerId, Position } from '../game/types'

const OPPONENT: PlayerId = 2

export type PuzzleStatus = 'playing' | 'wrong' | 'solved'

export function usePuzzleGame(puzzle: TacticalPuzzle) {
  const player = puzzle.playerToMove

  const [board, setBoard] = useState<Board>(() =>
    createBoardFromMatrix(puzzle.initialBoardMatrix),
  )
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [hopIndex, setHopIndex] = useState(0)
  const [chainCapturePiece, setChainCapturePiece] = useState<Position | null>(null)
  const [selected, setSelected] = useState<Position | null>(null)
  const [status, setStatus] = useState<PuzzleStatus>('playing')

  const reset = useCallback(() => {
    setBoard(createBoardFromMatrix(puzzle.initialBoardMatrix))
    setPhaseIndex(0)
    setHopIndex(0)
    setChainCapturePiece(null)
    setSelected(null)
    setStatus('playing')
  }, [puzzle])

  useEffect(() => {
    reset()
  }, [puzzle.id, reset])

  const expectedStep = useMemo((): MoveStep | null => {
    const phase = puzzle.phases[phaseIndex]
    if (!phase) return null
    return phase.playerLine[hopIndex] ?? null
  }, [puzzle, phaseIndex, hopIndex])

  const highlightPieces = useMemo(
    () =>
      status === 'playing'
        ? getPiecesWithLegalMoves(board, player, chainCapturePiece)
        : [],
    [board, player, chainCapturePiece, status],
  )

  const validMoves = useMemo(() => {
    if (!selected || status !== 'playing') return []
    return getMovesForPiece(board, player, selected, chainCapturePiece)
  }, [board, player, selected, chainCapturePiece, status])

  const applyOpponentReply = useCallback(
    (reply: MoveStep, afterBoard: Board) => {
      const result = applyMove(afterBoard, reply, OPPONENT, null)
      setBoard(result.board)
      setChainCapturePiece(null)
      setSelected(null)
    },
    [],
  )

  const advanceAfterPlayerTurn = useCallback(
    (nextBoard: Board, nextHopIndex: number) => {
      const phase = puzzle.phases[phaseIndex]
      if (!phase) {
        setStatus('solved')
        return
      }

      if (nextHopIndex < phase.playerLine.length) {
        setHopIndex(nextHopIndex)
        return
      }

      if (phase.opponentReply) {
        applyOpponentReply(phase.opponentReply, nextBoard)
        const nextPhase = phaseIndex + 1
        if (nextPhase >= puzzle.phases.length) {
          setStatus('solved')
        } else {
          setPhaseIndex(nextPhase)
          setHopIndex(0)
        }
        return
      }

      const nextPhase = phaseIndex + 1
      if (nextPhase >= puzzle.phases.length) {
        setStatus('solved')
      } else {
        setPhaseIndex(nextPhase)
        setHopIndex(0)
      }
    },
    [applyOpponentReply, phaseIndex, puzzle.phases],
  )

  const tryMove = useCallback(
    (step: MoveStep) => {
      if (status !== 'playing') return
      const expected = expectedStep
      if (!expected || !stepsEqual(step, expected)) {
        setStatus('wrong')
        setSelected(null)
        return
      }

      const result = applyMove(board, step, player, chainCapturePiece)
      setBoard(result.board)

      const nextHopIndex = hopIndex + 1

      if (result.chainCapturePiece) {
        setChainCapturePiece(result.chainCapturePiece)
        setSelected(result.chainCapturePiece)
        setHopIndex(nextHopIndex)
        return
      }

      setChainCapturePiece(null)
      advanceAfterPlayerTurn(result.board, nextHopIndex)
    },
    [
      status,
      expectedStep,
      board,
      player,
      chainCapturePiece,
      hopIndex,
      advanceAfterPlayerTurn,
    ],
  )

  const selectSquare = useCallback(
    (pos: Position) => {
      if (status !== 'playing') return

      const cell = board[pos.row][pos.col]
      const owner = cell === 1 || cell === 3 ? 1 : cell === 2 || cell === 4 ? 2 : null

      const movesForSelected = selected
        ? getMovesForPiece(board, player, selected, chainCapturePiece)
        : []

      const target = movesForSelected.find(
        (m) => m.to.row === pos.row && m.to.col === pos.col,
      )

      if (target && selected) {
        tryMove(target)
        return
      }

      if (chainCapturePiece) {
        if (
          chainCapturePiece.row !== pos.row ||
          chainCapturePiece.col !== pos.col
        ) {
          return
        }
        const chainMoves = getMovesForPiece(
          board,
          player,
          chainCapturePiece,
          chainCapturePiece,
        )
        const chainTarget = chainMoves.find(
          (m) => m.to.row === pos.row && m.to.col === pos.col,
        )
        if (chainTarget) tryMove(chainTarget)
        return
      }

      const canSelect = highlightPieces.some(
        (p) => p.row === pos.row && p.col === pos.col,
      )
      if (owner === player && canSelect) {
        setSelected(pos)
      } else {
        setSelected(null)
      }
    },
    [
      status,
      board,
      player,
      selected,
      chainCapturePiece,
      highlightPieces,
      tryMove,
    ],
  )

  return {
    board,
    player,
    selected,
    validMoves,
    highlightPieces,
    chainCapturePiece,
    status,
    phaseIndex,
    hopIndex,
    expectedStep,
    reset,
    selectSquare,
  }
}
