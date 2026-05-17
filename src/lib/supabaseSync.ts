import type { User } from '../context/AuthContext'
import type { MatchResult } from './stats'
import { eloChangeForResult, createMatchRecord } from './stats'
import { getSupabase, isSupabaseConfigured } from './supabase'
import { saveToStorage, PROFILE_KEY } from './storage'

export const isSupabaseOnline = isSupabaseConfigured()

export async function syncUserProfile(user: User): Promise<void> {
  saveToStorage(PROFILE_KEY, user)

  if (!isSupabaseOnline) return

  const supabase = getSupabase()
  if (!supabase) return

  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      avatar: user.avatar,
      elo: user.elo,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      points: user.points,
      is_pro: user.isPro,
      country: user.country,
      city: user.city,
      updated_at: new Date().toISOString(),
    })
  } catch {
    /* local-first: DB optional until schema exists */
  }
}

export interface OnlineMatchPayload {
  roomCode: string
  localUserId: string
  opponentUserId: string
  opponentName: string
  result: MatchResult
  localEloBefore: number
  opponentElo: number
  accuracy?: number
  performanceElo?: number
}

/** Persist ranked online result to Supabase + always mirror locally via caller. */
export async function recordOnlineMatchToBackend(
  payload: OnlineMatchPayload,
): Promise<void> {
  if (!isSupabaseOnline) return

  const supabase = getSupabase()
  if (!supabase) return

  const eloDelta = eloChangeForResult(payload.result)

  try {
    await supabase.from('match_results').insert({
      room_code: payload.roomCode,
      player_id: payload.localUserId,
      opponent_id: payload.opponentUserId,
      opponent_name: payload.opponentName,
      result: payload.result,
      elo_change: eloDelta,
      opponent_elo: payload.opponentElo,
      accuracy: payload.accuracy ?? null,
      performance_elo: payload.performanceElo ?? null,
      played_at: new Date().toISOString(),
    })

    await supabase.rpc('apply_elo_delta', {
      p_user_id: payload.localUserId,
      p_delta: eloDelta,
    })
  } catch {
    /* RPC/table may not exist yet — local profile still updated */
  }
}

export function buildLocalMatchFromOnline(payload: OnlineMatchPayload) {
  return createMatchRecord({
    mode: 'Online PvP',
    result: payload.result,
    opponent: payload.opponentName,
    opponentElo: payload.opponentElo,
    accuracy: payload.accuracy,
    performanceElo: payload.performanceElo,
  })
}
