import type { MatchRecord } from '../context/AuthContext'

export const DEFAULT_ELO = 1200

export const ELO_WIN = 15
export const ELO_LOSS = -12
export const ELO_DRAW = 0

export type MatchResult = 'win' | 'loss' | 'draw'

export interface RecordMatchInput {
  mode: string
  result: MatchResult
  opponent: string
  opponentElo?: number
  accuracy?: number
  performanceElo?: number
}

export function eloChangeForResult(result: MatchResult): number {
  if (result === 'win') return ELO_WIN
  if (result === 'loss') return ELO_LOSS
  return ELO_DRAW
}

export function createMatchRecord(input: RecordMatchInput): MatchRecord {
  const eloChange = eloChangeForResult(input.result)
  return {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    opponent: input.opponent,
    result: input.result,
    eloChange,
    mode: input.mode,
    date: new Date().toISOString().slice(0, 10),
    opponentElo: input.opponentElo,
    accuracy: input.accuracy,
    performanceElo: input.performanceElo,
  }
}

export function applyMatchToProfile(
  profile: {
    elo: number
    wins: number
    losses: number
    draws: number
    matchHistory: MatchRecord[]
  },
  match: MatchRecord,
): typeof profile {
  return {
    elo: Math.max(400, profile.elo + match.eloChange),
    wins: profile.wins + (match.result === 'win' ? 1 : 0),
    losses: profile.losses + (match.result === 'loss' ? 1 : 0),
    draws: profile.draws + (match.result === 'draw' ? 1 : 0),
    matchHistory: [match, ...profile.matchHistory].slice(0, 50),
  }
}
