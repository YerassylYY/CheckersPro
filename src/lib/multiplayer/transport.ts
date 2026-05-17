import type { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabase } from '../supabase'
import type { NetworkBroadcastEvent, PresencePayload } from './events'

export type PresenceListener = (members: PresencePayload[]) => void
export type BroadcastListener = (event: NetworkBroadcastEvent, senderId?: string) => void
export type LeaveListener = (userId: string) => void

export interface RoomTransportOptions {
  /** Watch-only: receive broadcasts, no presence seat. */
  spectator?: boolean
}

export interface RoomTransport {
  join(): Promise<void>
  leave(): Promise<void>
  trackPresence(payload: PresencePayload): Promise<void>
  send(event: NetworkBroadcastEvent): Promise<void>
}

/** In-browser fallback when Supabase env vars are missing (same machine / tabs). */
class BroadcastChannelTransport implements RoomTransport {
  private channel: BroadcastChannel
  private onBroadcast: BroadcastListener
  private onPresence: PresenceListener
  private onLeave: LeaveListener
  private userId: string
  private spectator: boolean
  private localPresence: PresencePayload | null = null
  private members = new Map<string, PresencePayload>()

  constructor(
    roomCode: string,
    userId: string,
    handlers: {
      onBroadcast: BroadcastListener
      onPresence: PresenceListener
      onLeave: LeaveListener
    },
    options?: RoomTransportOptions,
  ) {
    this.channel = new BroadcastChannel(`blitzcheckers:${roomCode}`)
    this.userId = userId
    this.spectator = options?.spectator ?? false
    this.onBroadcast = handlers.onBroadcast
    this.onPresence = handlers.onPresence
    this.onLeave = handlers.onLeave

    this.channel.onmessage = (msg) => {
      const data = msg.data as {
        kind: string
        payload?: unknown
        userId?: string
      }
      if (data.kind === 'broadcast' && data.payload) {
        this.onBroadcast(data.payload as NetworkBroadcastEvent, data.userId)
      }
      if (data.kind === 'presence' && data.payload) {
        const p = data.payload as PresencePayload
        this.members.set(p.userId, p)
        this.onPresence([...this.members.values()])
      }
      if (data.kind === 'leave' && data.userId) {
        this.members.delete(data.userId)
        this.onPresence([...this.members.values()])
        this.onLeave(data.userId)
      }
    }
  }

  async join(): Promise<void> {
    if (!this.spectator && this.localPresence) {
      this.channel.postMessage({ kind: 'presence', payload: this.localPresence })
    }
  }

  async leave(): Promise<void> {
    if (!this.spectator) {
      this.channel.postMessage({ kind: 'leave', userId: this.userId })
    }
    this.channel.close()
  }

  async trackPresence(payload: PresencePayload): Promise<void> {
    if (this.spectator) return
    this.localPresence = payload
    this.members.set(payload.userId, payload)
    this.channel.postMessage({ kind: 'presence', payload })
    this.onPresence([...this.members.values()])
  }

  async send(event: NetworkBroadcastEvent): Promise<void> {
    if (this.spectator) return
    this.channel.postMessage({
      kind: 'broadcast',
      payload: event,
      userId: this.userId,
    })
  }
}

class SupabaseChannelTransport implements RoomTransport {
  private channel: RealtimeChannel
  private joined = false
  private spectator: boolean

  constructor(
    roomCode: string,
    userId: string,
    handlers: {
      onBroadcast: BroadcastListener
      onPresence: PresenceListener
      onLeave: LeaveListener
    },
    options?: RoomTransportOptions,
  ) {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not configured')

    this.spectator = options?.spectator ?? false

    this.channel = supabase.channel(`room:${roomCode}`, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    })

    this.channel
      .on('broadcast', { event: 'game_event' }, ({ payload }) => {
        try {
          handlers.onBroadcast(payload as NetworkBroadcastEvent)
        } catch {
          /* ignore malformed */
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel.presenceState<PresencePayload>()
        const members: PresencePayload[] = []
        for (const key of Object.keys(state)) {
          const rows = state[key]
          if (rows?.[0]) members.push(rows[0] as PresencePayload)
        }
        handlers.onPresence(members)
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key) handlers.onLeave(key)
      })
  }

  async join(): Promise<void> {
    if (this.joined) return
    await new Promise<void>((resolve, reject) => {
      this.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.joined = true
          resolve()
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(new Error(`Channel subscribe failed: ${status}`))
        }
      })
    })
  }

  async leave(): Promise<void> {
    if (!this.joined) return
    const supabase = getSupabase()
    try {
      if (supabase) {
        await supabase.removeChannel(this.channel)
      } else {
        await this.channel.unsubscribe()
      }
    } catch {
      await this.channel.unsubscribe().catch(() => {})
    }
    this.joined = false
  }

  async trackPresence(payload: PresencePayload): Promise<void> {
    if (this.spectator) return
    await this.channel.track(payload)
  }

  async send(event: NetworkBroadcastEvent): Promise<void> {
    if (this.spectator) return
    await this.channel.send({
      type: 'broadcast',
      event: 'game_event',
      payload: event,
    })
  }
}

export function createRoomTransport(
  roomCode: string,
  userId: string,
  handlers: {
    onBroadcast: BroadcastListener
    onPresence: PresenceListener
    onLeave: LeaveListener
  },
  options?: RoomTransportOptions,
): RoomTransport {
  if (getSupabase()) {
    return new SupabaseChannelTransport(roomCode, userId, handlers, options)
  }
  return new BroadcastChannelTransport(roomCode, userId, handlers, options)
}
