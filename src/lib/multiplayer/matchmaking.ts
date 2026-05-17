import type { RealtimeChannel } from '@supabase/supabase-js'
import { generateRoomCode } from '../roomCode'
import { getSupabase, isSupabaseConfigured } from '../supabase'

export const MATCHMAKING_CHANNEL = 'global_matchmaking'
export const MATCHMAKING_TIMEOUT_MS = 10_000

export interface MatchmakingPlayer {
  userId: string
  displayName: string
  avatar: string
  elo: number
  joinedAt: number
}

export type MatchmakingBroadcast =
  | { type: 'looking_for_game'; player: MatchmakingPlayer }
  | { type: 'cancel_search'; userId: string }
  | {
      type: 'match_found'
      roomCode: string
      hostUserId: string
      guestUserId: string
      targetUserId: string
    }

export interface MatchmakingCallbacks {
  onMatchFound: (roomCode: string, asHost: boolean) => void
  onQueueUpdate?: (waitingCount: number) => void
  onError?: (message: string) => void
}

interface ActiveSearch {
  player: MatchmakingPlayer
  callbacks: MatchmakingCallbacks
}

/** In-memory queue of other players seen via broadcast. */
const remoteQueue = new Map<string, MatchmakingPlayer>()

let localSearch: ActiveSearch | null = null
let supabaseChannel: RealtimeChannel | null = null
let bcChannel: BroadcastChannel | null = null
let timeoutHandle: ReturnType<typeof setTimeout> | null = null
let handshakeLock = false

function clearSearchTimeout(): void {
  if (timeoutHandle) {
    clearTimeout(timeoutHandle)
    timeoutHandle = null
  }
}

function dispatchBroadcast(payload: MatchmakingBroadcast): void {
  if (payload.type === 'looking_for_game') {
    if (payload.player.userId === localSearch?.player.userId) return
    remoteQueue.set(payload.player.userId, payload.player)
    localSearch?.callbacks.onQueueUpdate?.(remoteQueue.size)

    if (localSearch && !handshakeLock) {
      tryHostHandshake(payload.player)
    }
    return
  }

  if (payload.type === 'cancel_search') {
    remoteQueue.delete(payload.userId)
    localSearch?.callbacks.onQueueUpdate?.(remoteQueue.size)
    return
  }

  if (payload.type === 'match_found') {
    if (!localSearch) return
    if (payload.targetUserId !== localSearch.player.userId) return
    if (handshakeLock) return
    handshakeLock = true
    clearSearchTimeout()
    const asHost = payload.hostUserId === localSearch.player.userId
    stopMatchmakingInternal(false)
    localSearch.callbacks.onMatchFound(payload.roomCode, asHost)
  }
}

function tryHostHandshake(other: MatchmakingPlayer): void {
  if (!localSearch || handshakeLock) return
  const me = localSearch.player
  if (me.joinedAt > other.joinedAt) return
  if (
    me.joinedAt === other.joinedAt &&
    me.userId.localeCompare(other.userId) > 0
  ) {
    return
  }
  handshakeLock = true
  const roomCode = generateRoomCode()
  const matchPayload: MatchmakingBroadcast = {
    type: 'match_found',
    roomCode,
    hostUserId: me.userId,
    guestUserId: other.userId,
    targetUserId: other.userId,
  }
  void sendMatchmakingBroadcast(matchPayload)
  clearSearchTimeout()
  stopMatchmakingInternal(false)
  localSearch.callbacks.onMatchFound(roomCode, true)
}

async function sendMatchmakingBroadcast(
  payload: MatchmakingBroadcast,
): Promise<void> {
  const supabase = getSupabase()
  if (supabase && supabaseChannel) {
    await supabaseChannel.send({
      type: 'broadcast',
      event: 'matchmaking',
      payload,
    })
    return
  }
  bcChannel?.postMessage({ kind: 'matchmaking', payload })
}

function wireSupabaseChannel(): RealtimeChannel | null {
  const supabase = getSupabase()
  if (!supabase) return null

  const channel = supabase.channel(MATCHMAKING_CHANNEL, {
    config: { broadcast: { self: false } },
  })

  channel.on('broadcast', { event: 'matchmaking' }, ({ payload }) => {
    try {
      dispatchBroadcast(payload as MatchmakingBroadcast)
    } catch {
      /* malformed */
    }
  })

  return channel
}

function wireBroadcastChannel(): BroadcastChannel {
  const ch = new BroadcastChannel(`blitzcheckers:${MATCHMAKING_CHANNEL}`)
  ch.onmessage = (msg) => {
    const data = msg.data as { kind: string; payload?: MatchmakingBroadcast }
    if (data.kind === 'matchmaking' && data.payload) {
      dispatchBroadcast(data.payload)
    }
  }
  return ch
}

async function ensureChannelSubscribed(): Promise<void> {
  const supabase = getSupabase()
  if (supabase && !supabaseChannel) {
    supabaseChannel = wireSupabaseChannel()
    await new Promise<void>((resolve, reject) => {
      supabaseChannel!.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve()
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(new Error(`Matchmaking subscribe failed: ${status}`))
        }
      })
    })
    return
  }

  if (!bcChannel) {
    bcChannel = wireBroadcastChannel()
  }
}

/**
 * Join the global matchmaking pool and broadcast `looking_for_game`.
 */
export async function startMatchmaking(
  player: Omit<MatchmakingPlayer, 'joinedAt'>,
  callbacks: MatchmakingCallbacks,
): Promise<void> {
  await stopMatchmaking()

  const entry: MatchmakingPlayer = {
    ...player,
    joinedAt: Date.now(),
  }

  localSearch = { player: entry, callbacks }
  handshakeLock = false
  remoteQueue.clear()

  try {
    await ensureChannelSubscribed()
    await sendMatchmakingBroadcast({ type: 'looking_for_game', player: entry })

    for (const other of remoteQueue.values()) {
      if (other.userId === entry.userId) continue
      if (entry.joinedAt < other.joinedAt) {
        tryHostHandshake(other)
        break
      }
    }

    callbacks.onQueueUpdate?.(remoteQueue.size)

    timeoutHandle = setTimeout(() => {
      if (localSearch?.player.userId === entry.userId && !handshakeLock) {
        callbacks.onError?.('timeout')
      }
    }, MATCHMAKING_TIMEOUT_MS)
  } catch (err) {
    callbacks.onError?.(
      err instanceof Error ? err.message : 'Matchmaking unavailable',
    )
    await stopMatchmaking()
  }
}

function stopMatchmakingInternal(notifyCancel: boolean): void {
  clearSearchTimeout()
  if (notifyCancel && localSearch) {
    void sendMatchmakingBroadcast({
      type: 'cancel_search',
      userId: localSearch.player.userId,
    })
  }
  localSearch = null
  remoteQueue.clear()
  handshakeLock = false
}

/** Leave queue and unsubscribe from matchmaking channel. */
export async function stopMatchmaking(): Promise<void> {
  stopMatchmakingInternal(true)

  const supabase = getSupabase()
  if (supabase && supabaseChannel) {
    try {
      await supabase.removeChannel(supabaseChannel)
    } catch {
      /* ignore */
    }
    supabaseChannel = null
  }

  if (bcChannel) {
    bcChannel.close()
    bcChannel = null
  }
}

export function isMatchmakingActive(): boolean {
  return localSearch !== null
}

export function matchmakingUsesSupabase(): boolean {
  return isSupabaseConfigured()
}
