import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  REGIONAL_COMPETITORS,
  buildLeaderboard,
  type LeaderboardTab,
} from '../data/leaderboardCompetitors'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'

export interface LeaderboardRow {
  id: string
  name: string
  elo: number
  wins: number
  city: string
  country: string
  rank: number
  isYou?: boolean
}

interface ProfileRow {
  id: string
  display_name: string
  elo: number
  wins: number
  city: string | null
  country: string | null
}

export function useLeaderboard(tab: LeaderboardTab, search: string) {
  const { user } = useAuth()
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(!isSupabaseConfigured())
  const [error, setError] = useState<string | null>(null)

  const fetchLive = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsOffline(true)
      return false
    }

    const supabase = getSupabase()
    if (!supabase) {
      setIsOffline(true)
      return false
    }

    try {
      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('id, display_name, elo, wins, city, country')
        .order('elo', { ascending: false })
        .limit(50)

      if (qErr) throw qErr

      const mapped: LeaderboardRow[] = (data as ProfileRow[]).map((p, i) => ({
        id: p.id,
        name: p.display_name,
        elo: p.elo ?? 1200,
        wins: p.wins ?? 0,
        city: p.city ?? 'Global',
        country: p.country ?? 'Kazakhstan',
        rank: i + 1,
        isYou: user?.id === p.id,
      }))

      setRows(mapped)
      setIsOffline(false)
      setError(null)
      return true
    } catch {
      setIsOffline(true)
      return false
    }
  }, [user?.id])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      const ok = await fetchLive()
      if (!cancelled) setLoading(false)

      if (!ok && !cancelled) {
        const offline = buildLeaderboard(
          REGIONAL_COMPETITORS,
          user
            ? {
                displayName: user.displayName,
                elo: user.elo,
                wins: user.wins,
                city: user.city,
              }
            : null,
          tab,
          search,
        )
        setRows(
          offline.map((e) => ({
            id: e.id,
            name: e.name,
            elo: e.elo,
            wins: e.wins,
            city: e.city,
            country: e.country,
            rank: e.rank,
            isYou: e.isYou,
          })),
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fetchLive, user, tab, search])

  const filteredRows = useMemo(() => {
    if (isOffline) return rows

    let list = [...rows]
    if (tab !== 'global') {
      list = list.filter(
        (r) => r.city.toLowerCase() === tab.toLowerCase(),
      )
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q),
      )
    }

    if (user && !list.some((r) => r.isYou)) {
      const me: LeaderboardRow = {
        id: user.id,
        name: user.displayName,
        elo: user.elo,
        wins: user.wins,
        city: user.city,
        country: user.country,
        rank: 0,
        isYou: true,
      }
      if (
        !q ||
        me.name.toLowerCase().includes(q) ||
        me.city.toLowerCase().includes(q)
      ) {
        if (tab === 'global' || me.city === tab) list = [...list, me]
      }
    }

    return list
      .sort((a, b) => b.elo - a.elo)
      .map((r, i) => ({ ...r, rank: i + 1 }))
  }, [rows, tab, search, isOffline, user])

  return {
    rows: filteredRows,
    loading,
    isOffline,
    error,
    refetch: fetchLive,
  }
}
