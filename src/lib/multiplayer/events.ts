import type { MoveStep, PlayerId, Position, RulesVariant } from '../../game/types'

export interface OpponentProfile {
  userId: string
  displayName: string
  avatar: string
  elo: number
  seat: PlayerId
}

export interface PresencePayload {
  userId: string
  displayName: string
  avatar: string
  elo: number
  isHost: boolean
  joinedAt: number
}

export type NetworkBroadcastEvent =
  | {
      type: 'game_start'
      rulesVariant: RulesVariant
      startedAt: number
      hostId: string
    }
  | {
      type: 'move_played'
      step: MoveStep
      player: PlayerId
      chainCapturePiece: Position | null
      moveId: string
    }
  | {
      type: 'chat_message'
      text: string
      fromUserId: string
      fromName: string
      at: number
    }
  | {
      type: 'player_resigned'
      player: PlayerId
      at: number
    }

export interface ChatMessage {
  id: string
  text: string
  fromUserId: string
  fromName: string
  at: number
  isLocal: boolean
}

export const DISCONNECT_GRACE_MS = 15_000
