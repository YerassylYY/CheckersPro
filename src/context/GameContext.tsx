import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { BotProfile } from '../data/bots'
import { botToLegacyDifficulty } from '../data/bots'
import { getAiMoveWithDelay, humanMissedCapture } from '../game/ai'
import {
  applyMove,
  createInitialBoard,
  getMovesForPiece,
  getPiecesWithLegalMoves,
} from '../game/engine'
import {
  playAccessibilityCapture,
  playCapture,
  playErrorAlert,
  playKing,
  playMove,
  playSelect,
  playVictory,
} from '../game/sounds'
import { usePreferences } from './PreferencesContext'
import { useGamification } from './GamificationContext'
import type {
  AiDifficulty,
  Board,
  GameMode,
  GameMove,
  MoveStep,
  PlayerId,
  Position,
  RulesVariant,
} from '../game/types'

interface GameContextValue {
  board: Board
  currentPlayer: PlayerId
  chainCapturePiece: Position | null
  mustContinueFrom: Position | null
  winner: PlayerId | null
  selected: Position | null
  validMoves: MoveStep[]
  highlightPieces: Position[]
  moveHistory: GameMove[]
  lastCaptureCount: number
  shakeBoard: boolean
  mode: GameMode
  aiDifficulty: AiDifficulty
  aiPlayer: PlayerId
  isAiThinking: boolean
  rulesVariant: RulesVariant
  setRulesVariant: (v: RulesVariant) => void
  networkSeat: PlayerId | null
  setNetworkSeat: (seat: PlayerId | null) => void
  applyRemoteMove: (step: MoveStep, player: PlayerId) => void
  registerMoveBroadcast: (
    fn:
      | ((
          step: MoveStep,
          player: PlayerId,
          chainCapturePiece: Position | null,
        ) => void)
      | null,
  ) => void
  setMode: (m: GameMode) => void
  setAiDifficulty: (d: AiDifficulty) => void
  selectedBot: BotProfile | null
  setSelectedBot: (bot: BotProfile | null) => void
  registerHumanBlunder: (fn: (() => void) | null) => void
  resetGame: () => void
  selectSquare: (pos: Position) => void
  applyFlagFall: (winner: PlayerId) => void
  clearSelection: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const { accessibilityFeedback, triggerFlash } = usePreferences()
  const { addSessionCaptures, resetSessionCaptures } = useGamification()
  const [board, setBoard] = useState<Board>(createInitialBoard)
  const [currentPlayer, setCurrentPlayer] = useState<PlayerId>(1)
  const [chainCapturePiece, setChainCapturePiece] = useState<Position | null>(null)
  const [winner, setWinner] = useState<PlayerId | null>(null)
  const [selected, setSelected] = useState<Position | null>(null)
  const [moveHistory, setMoveHistory] = useState<GameMove[]>([])
  const [lastCaptureCount, setLastCaptureCount] = useState(0)
  const [shakeBoard, setShakeBoard] = useState(false)
  const [mode, setMode] = useState<GameMode>('local')
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('intermediate')
  const [selectedBot, setSelectedBot] = useState<BotProfile | null>(null)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [rulesVariant, setRulesVariant] = useState<RulesVariant>('STANDARD')
  const [networkSeat, setNetworkSeat] = useState<PlayerId | null>(null)
  const humanBlunderRef = useRef<(() => void) | null>(null)
  const suppressNetworkRef = useRef(false)
  const moveBroadcastRef = useRef<
    | ((
        step: MoveStep,
        player: PlayerId,
        chainCapturePiece: Position | null,
      ) => void)
    | null
  >(null)

  const aiPlayer: PlayerId = 2

  const registerHumanBlunder = useCallback((fn: (() => void) | null) => {
    humanBlunderRef.current = fn
  }, [])

  useEffect(() => {
    if (selectedBot) setAiDifficulty(botToLegacyDifficulty(selectedBot))
  }, [selectedBot])

  const highlightPieces = useMemo(
    () =>
      winner
        ? []
        : getPiecesWithLegalMoves(
            board,
            currentPlayer,
            chainCapturePiece,
            rulesVariant,
          ),
    [board, currentPlayer, chainCapturePiece, winner, rulesVariant],
  )

  const validMoves = useMemo(() => {
    if (!selected) return []
    return getMovesForPiece(
      board,
      currentPlayer,
      selected,
      chainCapturePiece,
      rulesVariant,
    )
  }, [board, currentPlayer, selected, chainCapturePiece, rulesVariant])

  useEffect(() => {
    if (chainCapturePiece && !winner) {
      setSelected(chainCapturePiece)
    }
  }, [chainCapturePiece, winner])

  const registerMoveBroadcast = useCallback(
    (
      fn:
        | ((
            step: MoveStep,
            player: PlayerId,
            chainCapturePiece: Position | null,
          ) => void)
        | null,
    ) => {
      moveBroadcastRef.current = fn
    },
    [],
  )

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard())
    setCurrentPlayer(1)
    setChainCapturePiece(null)
    setWinner(null)
    setSelected(null)
    setMoveHistory([])
    setLastCaptureCount(0)
    setShakeBoard(false)
    setIsAiThinking(false)
    resetSessionCaptures()
  }, [resetSessionCaptures])

  const applyFlagFall = useCallback((w: PlayerId) => {
    setWinner(w)
    setSelected(null)
    setChainCapturePiece(null)
    playVictory()
  }, [])

  const executeMove = useCallback(
    (step: MoveStep, player: PlayerId) => {
      if (
        mode === 'ai' &&
        player === 1 &&
        humanMissedCapture(board, player, step)
      ) {
        humanBlunderRef.current?.()
      }

      const caps = step.captured?.length ?? 0
      setLastCaptureCount(caps)

      if (caps > 0) {
        playCapture()
        addSessionCaptures(caps)
        if (accessibilityFeedback) {
          triggerFlash('capture')
          playAccessibilityCapture()
        }
        if (caps > 1 || chainCapturePiece) {
          setShakeBoard(true)
          setTimeout(() => setShakeBoard(false), 450)
        }
      } else {
        playMove()
      }

      const result = applyMove(
        board,
        step,
        player,
        chainCapturePiece,
        rulesVariant,
      )
      setBoard(result.board)
      setCurrentPlayer(result.currentPlayer)
      setChainCapturePiece(result.chainCapturePiece)
      setSelected(result.chainCapturePiece)

      if (result.promoted) playKing()

      setMoveHistory((h) => {
        const last = h[h.length - 1]
        if (last && last.player === player && result.chainCapturePiece) {
          return [
            ...h.slice(0, -1),
            { player, steps: [...last.steps, step] },
          ]
        }
        return [...h, { player, steps: [step] }]
      })

      if (result.winner) {
        setWinner(result.winner)
        setSelected(null)
        setChainCapturePiece(null)
        playVictory()
      }

      if (
        mode === 'online' &&
        !suppressNetworkRef.current &&
        moveBroadcastRef.current
      ) {
        moveBroadcastRef.current(step, player, result.chainCapturePiece)
      }
    },
    [
      board,
      chainCapturePiece,
      mode,
      rulesVariant,
      addSessionCaptures,
      accessibilityFeedback,
      triggerFlash,
    ],
  )

  const applyRemoteMove = useCallback(
    (step: MoveStep, player: PlayerId) => {
      suppressNetworkRef.current = true
      try {
        executeMove(step, player)
      } finally {
        suppressNetworkRef.current = false
      }
    },
    [executeMove],
  )

  const runAiTurn = useCallback(async () => {
    if (winner || mode !== 'ai' || currentPlayer !== aiPlayer || isAiThinking) return
    setIsAiThinking(true)
    if (!chainCapturePiece) setSelected(null)
    try {
      if (!selectedBot) return
      const move = await getAiMoveWithDelay(
        board,
        aiPlayer,
        selectedBot,
        chainCapturePiece,
      )
      if (move) executeMove(move, aiPlayer)
    } finally {
      setIsAiThinking(false)
    }
  }, [
    board,
    winner,
    mode,
    currentPlayer,
    aiPlayer,
    selectedBot,
    isAiThinking,
    chainCapturePiece,
    rulesVariant,
    executeMove,
  ])

  const selectSquare = useCallback(
    (pos: Position) => {
      if (winner || isAiThinking) return
      if (mode === 'ai' && currentPlayer === aiPlayer) return
      if (mode === 'online' && networkSeat && currentPlayer !== networkSeat) return

      const cell = board[pos.row][pos.col]
      const owner = cell === 1 || cell === 3 ? 1 : cell === 2 || cell === 4 ? 2 : null

      const movesForSelected = selected
        ? getMovesForPiece(
            board,
            currentPlayer,
            selected,
            chainCapturePiece,
            rulesVariant,
          )
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

      if (chainCapturePiece) {
        if (!positionsEqual(chainCapturePiece, pos)) {
          if (accessibilityFeedback) {
            triggerFlash('error')
            playErrorAlert()
          }
          return
        }
        const chainMoves = getMovesForPiece(
          board,
          currentPlayer,
          chainCapturePiece,
          chainCapturePiece,
          rulesVariant,
        )
        const chainTarget = chainMoves.find(
          (m) => m.to.row === pos.row && m.to.col === pos.col,
        )
        if (chainTarget) executeMove(chainTarget, currentPlayer)
        return
      }

      const isHighlight = highlightPieces.some(
        (p) => p.row === pos.row && p.col === pos.col,
      )

      if (owner === currentPlayer && isHighlight) {
        setSelected(pos)
        playSelect()
      } else if (owner !== currentPlayer && !isTarget) {
        if (accessibilityFeedback) {
          triggerFlash('error')
          playErrorAlert()
        }
        setSelected(null)
      } else {
        setSelected(null)
      }
    },
    [
      board,
      winner,
      isAiThinking,
      mode,
      currentPlayer,
      aiPlayer,
      highlightPieces,
      selected,
      chainCapturePiece,
      rulesVariant,
      networkSeat,
      executeMove,
      accessibilityFeedback,
      triggerFlash,
    ],
  )

  useEffect(() => {
    if (mode === 'ai' && currentPlayer === aiPlayer && !winner && !isAiThinking) {
      runAiTurn()
    }
  }, [
    mode,
    currentPlayer,
    aiPlayer,
    winner,
    isAiThinking,
    chainCapturePiece,
    runAiTurn,
  ])

  const clearSelection = useCallback(() => setSelected(null), [])

  const value: GameContextValue = {
    board,
    currentPlayer,
    chainCapturePiece,
    mustContinueFrom: chainCapturePiece,
    winner,
    selected,
    validMoves,
    highlightPieces,
    moveHistory,
    lastCaptureCount,
    shakeBoard,
    mode,
    aiDifficulty,
    aiPlayer,
    isAiThinking,
    rulesVariant,
    setRulesVariant,
    networkSeat,
    setNetworkSeat,
    applyRemoteMove,
    registerMoveBroadcast,
    setMode,
    setAiDifficulty,
    selectedBot,
    setSelectedBot,
    registerHumanBlunder,
    resetGame,
    selectSquare,
    applyFlagFall,
    clearSelection,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
