import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { createRoomTransport, type RoomTransport } from '../lib/multiplayer/transport'
import {
  DISCONNECT_GRACE_MS,
  type ChatMessage,
  type NetworkBroadcastEvent,
  type OpponentProfile,
  type PresencePayload,
} from '../lib/multiplayer/events'
import { generateRoomCode, normalizeRoomCode } from '../lib/roomCode'
import { isSupabaseConfigured } from '../lib/supabase'
import { recordOnlineMatchToBackend } from '../lib/supabaseSync'
import type { MoveStep, PlayerId, Position, RulesVariant } from '../game/types'

type LobbyStatus = 'idle' | 'connecting' | 'waiting' | 'ready' | 'in_match' | 'ended'

interface MultiplayerContextValue {
  roomCode: string | null
  isHost: boolean
  localSeat: PlayerId | null
  opponentProfile: OpponentProfile | null
  isConnected: boolean
  lobbyStatus: LobbyStatus
  networkTurn: PlayerId | null
  setNetworkTurn: (p: PlayerId | null) => void
  chatMessages: ChatMessage[]
  disconnectCountdown: number | null
  matchStarted: boolean
  rulesVariant: RulesVariant
  setLobbyRulesVariant: (v: RulesVariant) => void
  createRoom: () => Promise<string>
  joinRoom: (code: string, asHost?: boolean) => Promise<void>
  joinRoomAsSpectator: (code: string) => Promise<void>
  leaveRoom: () => Promise<void>
  isSpectator: boolean
  livePlayers: PresencePayload[]
  startNetworkMatch: () => Promise<void>
  sendNetworkMove: (
    step: MoveStep,
    player: PlayerId,
    chainCapturePiece: Position | null,
  ) => Promise<void>
  sendNetworkChat: (text: string) => Promise<void>
  resignMatch: () => Promise<void>
  registerEventHandler: (
    fn: ((event: NetworkBroadcastEvent) => void) | null,
  ) => void
  recordNetworkMatchEnd: (
    result: 'win' | 'loss',
    stats?: { accuracy?: number; performanceElo?: number },
  ) => Promise<void>
  usingSupabase: boolean
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null)

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const { user, recordMatch } = useAuth()
  const transportRef = useRef<RoomTransport | null>(null)
  const graceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const eventHandlerRef = useRef<
    ((e: NetworkBroadcastEvent) => void) | null
  >(null)
  const opponentIdRef = useRef<string | null>(null)
  const matchStartedRef = useRef(false)
  const localSeatRef = useRef<PlayerId | null>(null)
  const isSpectatorRef = useRef(false)

  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [localSeat, setLocalSeat] = useState<PlayerId | null>(null)
  const [opponentProfile, setOpponentProfile] = useState<OpponentProfile | null>(
    null,
  )
  const [isConnected, setIsConnected] = useState(false)
  const [lobbyStatus, setLobbyStatus] = useState<LobbyStatus>('idle')
  const [networkTurn, setNetworkTurn] = useState<PlayerId | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(
    null,
  )
  const [matchStarted, setMatchStarted] = useState(false)
  const [rulesVariant, setLobbyRulesVariant] = useState<RulesVariant>('STANDARD')
  const [matchRecorded, setMatchRecorded] = useState(false)
  const [isSpectator, setIsSpectator] = useState(false)
  const [livePlayers, setLivePlayers] = useState<PresencePayload[]>([])

  useEffect(() => {
    opponentIdRef.current = opponentProfile?.userId ?? null
  }, [opponentProfile?.userId])

  useEffect(() => {
    matchStartedRef.current = matchStarted
  }, [matchStarted])

  useEffect(() => {
    localSeatRef.current = localSeat
  }, [localSeat])

  useEffect(() => {
    isSpectatorRef.current = isSpectator
  }, [isSpectator])

  const userId = user?.id ?? `guest-${Math.random().toString(36).slice(2, 9)}`
  const displayName = user?.displayName ?? 'Guest'
  const avatar = user?.avatar ?? 'G'
  const elo = user?.elo ?? 1200

  const clearGraceTimer = useCallback(() => {
    if (graceTimerRef.current) {
      clearInterval(graceTimerRef.current)
      graceTimerRef.current = null
    }
    setDisconnectCountdown(null)
  }, [])

  const startGracePeriod = useCallback(
    (onTimeout: () => void) => {
      clearGraceTimer()
      let remaining = DISCONNECT_GRACE_MS / 1000
      setDisconnectCountdown(remaining)
      graceTimerRef.current = setInterval(() => {
        remaining -= 1
        setDisconnectCountdown(remaining)
        if (remaining <= 0) {
          clearGraceTimer()
          onTimeout()
        }
      }, 1000)
    },
    [clearGraceTimer],
  )

  const resolveOpponentFromPresence = useCallback(
    (members: PresencePayload[]) => {
      if (isSpectatorRef.current) {
        setLivePlayers(members)
        return
      }

      const others = members.filter((m) => m.userId !== userId)
      if (others.length === 0) {
        setOpponentProfile(null)
        setLobbyStatus(isHost ? 'waiting' : 'connecting')
        return
      }

      const opp = others[0]
      const seat: PlayerId = isHost ? 2 : 1
      setOpponentProfile({
        userId: opp.userId,
        displayName: opp.displayName,
        avatar: opp.avatar,
        elo: opp.elo,
        seat,
      })
      setLocalSeat(isHost ? 1 : 2)
      setLobbyStatus('ready')
    },
    [userId, isHost],
  )

  const teardownTransport = useCallback(async () => {
    clearGraceTimer()
    try {
      await transportRef.current?.leave()
    } catch {
      /* ignore */
    }
    transportRef.current = null
    setIsConnected(false)
  }, [clearGraceTimer])

  const connectTransport = useCallback(
    async (
      code: string,
      host: boolean,
      options?: { spectator?: boolean },
    ) => {
      await teardownTransport()
      setLobbyStatus('connecting')

      const transport = createRoomTransport(
        code,
        userId,
        {
        onBroadcast: (event) => {
          try {
            if (event.type === 'chat_message' && event.fromUserId !== userId) {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: `remote-${event.at}`,
                  text: event.text,
                  fromUserId: event.fromUserId,
                  fromName: event.fromName,
                  at: event.at,
                  isLocal: false,
                },
              ])
            }
            eventHandlerRef.current?.(event)
          } catch {
            /* handler may throw on bad payload */
          }
        },
        onPresence: (members) => {
          clearGraceTimer()
          resolveOpponentFromPresence(members)
        },
        onLeave: (leftUserId) => {
          if (isSpectatorRef.current) return
          if (leftUserId === opponentIdRef.current && matchStartedRef.current) {
            startGracePeriod(() => {
              eventHandlerRef.current?.({
                type: 'player_resigned',
                player: localSeatRef.current === 1 ? 2 : 1,
                at: Date.now(),
              })
            })
          }
        },
        },
        options,
      )

      transportRef.current = transport
      await transport.join()

      if (!options?.spectator) {
        const presence: PresencePayload = {
          userId,
          displayName,
          avatar,
          elo,
          isHost: host,
          joinedAt: Date.now(),
        }
        await transport.trackPresence(presence)
      }

      setIsConnected(true)
      if (options?.spectator) {
        setLobbyStatus('in_match')
      } else {
        setLobbyStatus(host ? 'waiting' : 'connecting')
      }
    },
    [
      userId,
      displayName,
      avatar,
      elo,
      teardownTransport,
      resolveOpponentFromPresence,
      clearGraceTimer,
      startGracePeriod,
    ],
  )

  const createRoom = useCallback(async () => {
    const code = generateRoomCode()
    setRoomCode(code)
    setIsHost(true)
    setLocalSeat(1)
    setMatchStarted(false)
    setMatchRecorded(false)
    setChatMessages([])
    await connectTransport(code, true)
    return code
  }, [connectTransport])

  const joinRoom = useCallback(
    async (rawCode: string, asHost = false) => {
      const code = normalizeRoomCode(rawCode)
      if (!code) throw new Error('Invalid room code')
      setIsSpectator(false)
      setRoomCode(code)
      setIsHost(asHost)
      setLocalSeat(asHost ? 1 : 2)
      setMatchStarted(false)
      setMatchRecorded(false)
      setChatMessages([])
      setLivePlayers([])
      await connectTransport(code, asHost)
    },
    [connectTransport],
  )

  const joinRoomAsSpectator = useCallback(
    async (rawCode: string) => {
      const code = normalizeRoomCode(rawCode)
      if (!code) throw new Error('Invalid room code')
      setIsSpectator(true)
      setRoomCode(code)
      setIsHost(false)
      setLocalSeat(null)
      setOpponentProfile(null)
      setMatchStarted(true)
      setMatchRecorded(true)
      setChatMessages([])
      setLivePlayers([])
      await connectTransport(code, false, { spectator: true })
    },
    [connectTransport],
  )

  const leaveRoom = useCallback(async () => {
    await teardownTransport()
    setRoomCode(null)
    setIsHost(false)
    setLocalSeat(null)
    setOpponentProfile(null)
    setIsSpectator(false)
    setLivePlayers([])
    setLobbyStatus('idle')
    setMatchStarted(false)
    setNetworkTurn(null)
    setChatMessages([])
  }, [teardownTransport])

  const broadcast = useCallback(async (event: NetworkBroadcastEvent) => {
    try {
      await transportRef.current?.send(event)
    } catch (err) {
      console.error('[multiplayer] broadcast failed', err)
    }
  }, [])

  const startNetworkMatch = useCallback(async () => {
    if (!isHost || !roomCode) return
    const startedAt = Date.now()
    setMatchStarted(true)
    setLobbyStatus('in_match')
    setNetworkTurn(1)
    await broadcast({
      type: 'game_start',
      rulesVariant,
      startedAt,
      hostId: userId,
    })
  }, [isHost, roomCode, rulesVariant, userId, broadcast])

  const sendNetworkMove = useCallback(
    async (
      step: MoveStep,
      player: PlayerId,
      chainCapturePiece: Position | null,
    ) => {
      if (isSpectator) return
      const moveId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      await broadcast({
        type: 'move_played',
        step,
        player,
        chainCapturePiece,
        moveId,
      })
    },
    [broadcast, isSpectator],
  )

  const sendNetworkChat = useCallback(
    async (text: string) => {
      if (isSpectator) return
      const trimmed = text.trim()
      if (!trimmed) return
      const at = Date.now()
      setChatMessages((prev) => [
        ...prev,
        {
          id: `local-${at}`,
          text: trimmed,
          fromUserId: userId,
          fromName: displayName,
          at,
          isLocal: true,
        },
      ])
      await broadcast({
        type: 'chat_message',
        text: trimmed,
        fromUserId: userId,
        fromName: displayName,
        at,
      })
    },
    [broadcast, userId, displayName, isSpectator],
  )

  const resignMatch = useCallback(async () => {
    if (isSpectator || !localSeat) return
    await broadcast({
      type: 'player_resigned',
      player: localSeat,
      at: Date.now(),
    })
  }, [broadcast, localSeat])

  const recordNetworkMatchEnd = useCallback(
    async (
      result: 'win' | 'loss',
      stats?: { accuracy?: number; performanceElo?: number },
    ) => {
      if (matchRecorded || !opponentProfile || !roomCode) return
      setMatchRecorded(true)

      const payload = {
        roomCode,
        localUserId: userId,
        opponentUserId: opponentProfile.userId,
        opponentName: opponentProfile.displayName,
        result,
        localEloBefore: elo,
        opponentElo: opponentProfile.elo,
        accuracy: stats?.accuracy,
        performanceElo: stats?.performanceElo,
      }

      recordMatch({
        mode: 'Online PvP',
        result,
        opponent: opponentProfile.displayName,
        opponentElo: opponentProfile.elo,
        accuracy: stats?.accuracy,
        performanceElo: stats?.performanceElo,
      })

      try {
        await recordOnlineMatchToBackend(payload)
      } catch {
        /* local record already saved */
      }
    },
    [
      matchRecorded,
      opponentProfile,
      roomCode,
      userId,
      elo,
      recordMatch,
    ],
  )

  const registerEventHandler = useCallback(
    (fn: ((event: NetworkBroadcastEvent) => void) | null) => {
      eventHandlerRef.current = fn
    },
    [],
  )

  useEffect(() => {
    return () => {
      void teardownTransport()
    }
  }, [teardownTransport])

  const value: MultiplayerContextValue = {
    roomCode,
    isHost,
    localSeat,
    opponentProfile,
    isConnected,
    lobbyStatus,
    networkTurn,
    setNetworkTurn,
    chatMessages,
    disconnectCountdown,
    matchStarted,
    rulesVariant,
    setLobbyRulesVariant,
    createRoom,
    joinRoom,
    joinRoomAsSpectator,
    leaveRoom,
    isSpectator,
    livePlayers,
    startNetworkMatch,
    sendNetworkMove,
    sendNetworkChat,
    resignMatch,
    registerEventHandler,
    recordNetworkMatchEnd,
    usingSupabase: isSupabaseConfigured(),
  }

  return (
    <MultiplayerContext.Provider value={value}>{children}</MultiplayerContext.Provider>
  )
}

export function useMultiplayer() {
  const ctx = useContext(MultiplayerContext)
  if (!ctx) {
    throw new Error('useMultiplayer must be used within MultiplayerProvider')
  }
  return ctx
}

export function useMultiplayerOptional() {
  return useContext(MultiplayerContext)
}
