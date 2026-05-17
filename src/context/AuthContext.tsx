import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_ELO, applyMatchToProfile, createMatchRecord } from '../lib/stats'
import type { MatchResult, RecordMatchInput } from '../lib/stats'
import { loadFromStorage, PROFILE_KEY } from '../lib/storage'
import { syncUserProfile } from '../lib/supabaseSync'

export interface MatchRecord {
  id: string
  opponent: string
  result: MatchResult
  eloChange: number
  mode: string
  date: string
  accuracy?: number
  performanceElo?: number
  opponentElo?: number
}

export interface User {
  id: string
  email: string
  displayName: string
  avatar: string
  elo: number
  wins: number
  losses: number
  draws: number
  city: string
  country: string
  isPro: boolean
  points: number
  matchHistory: MatchRecord[]
  unlockedSkins?: string[]
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  recordMatch: (input: RecordMatchInput) => void
  updateProfile: (patch: Partial<Pick<User, 'displayName' | 'city' | 'country'>>) => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  unlockSkin: (skinId: string) => void
  setPro: (isPro: boolean) => void
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'P'
}

function createFreshUser(
  partial: Partial<User> & Pick<User, 'email' | 'displayName'>,
): User {
  return {
    id: partial.id ?? `u-${Date.now()}`,
    email: partial.email,
    displayName: partial.displayName,
    avatar: partial.avatar ?? initials(partial.displayName),
    elo: partial.elo ?? DEFAULT_ELO,
    wins: partial.wins ?? 0,
    losses: partial.losses ?? 0,
    draws: partial.draws ?? 0,
    city: partial.city ?? 'Almaty',
    country: partial.country ?? 'Kazakhstan',
    isPro: partial.isPro ?? false,
    points: partial.points ?? 0,
    matchHistory: partial.matchHistory ?? [],
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const persistUser = useCallback(async (next: User | null) => {
    setUser(next)
    if (next) await syncUserProfile(next)
  }, [])

  useEffect(() => {
    const stored = loadFromStorage<User>(PROFILE_KEY)
    if (stored) {
      setUser({
        ...createFreshUser({
          email: stored.email,
          displayName: stored.displayName,
        }),
        ...stored,
        draws: stored.draws ?? 0,
        matchHistory: stored.matchHistory ?? [],
      })
    }
    setIsLoading(false)
  }, [])

  const simulateDelay = () =>
    new Promise<void>((r) => setTimeout(r, 600))

  const login = useCallback(
    async (email: string, _password: string) => {
      setIsLoading(true)
      await simulateDelay()
      const stored = loadFromStorage<User>(PROFILE_KEY)
      if (stored && stored.email === email) {
        await persistUser({
          ...stored,
          draws: stored.draws ?? 0,
          matchHistory: stored.matchHistory ?? [],
        })
      } else {
        await persistUser(
          createFreshUser({
            email,
            displayName: email.split('@')[0],
          }),
        )
      }
      setIsLoading(false)
    },
    [persistUser],
  )

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true)
    await simulateDelay()
    const stored = loadFromStorage<User>(PROFILE_KEY)
    if (stored) {
      await persistUser(stored)
    } else {
      await persistUser(
        createFreshUser({
          email: 'google@blitzcheckers.pro',
          displayName: 'Google Player',
        }),
      )
    }
    setIsLoading(false)
  }, [persistUser])

  const register = useCallback(
    async (email: string, _password: string, name: string) => {
      setIsLoading(true)
      await simulateDelay()
      await persistUser(
        createFreshUser({
          email,
          displayName: name,
          elo: DEFAULT_ELO,
          wins: 0,
          losses: 0,
          draws: 0,
          matchHistory: [],
          points: 0,
        }),
      )
      setIsLoading(false)
    },
    [persistUser],
  )

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const recordMatch = useCallback(
    (input: RecordMatchInput) => {
      setUser((prev) => {
        if (!prev) return prev
        const match = createMatchRecord(input)
        const updated = applyMatchToProfile(prev, match)
        const coinBonus = input.result === 'win' ? 25 : 0
        const next: User = {
          ...prev,
          ...updated,
          points: prev.points + coinBonus,
        }
        void syncUserProfile(next)
        return next
      })
    },
    [],
  )

  const addCoins = useCallback((amount: number) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, points: prev.points + amount }
      void syncUserProfile(next)
      return next
    })
  }, [])

  const unlockSkin = useCallback((skinId: string) => {
    setUser((prev) => {
      if (!prev) return prev
      const list = prev.unlockedSkins ?? ['classic']
      if (list.includes(skinId)) return prev
      const next = { ...prev, unlockedSkins: [...list, skinId] }
      void syncUserProfile(next)
      return next
    })
  }, [])

  const spendCoins = useCallback((amount: number): boolean => {
    let ok = false
    setUser((prev) => {
      if (!prev || prev.points < amount) return prev
      ok = true
      const next = { ...prev, points: prev.points - amount }
      void syncUserProfile(next)
      return next
    })
    return ok
  }, [])

  const setPro = useCallback((isPro: boolean) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, isPro }
      void syncUserProfile(next)
      return next
    })
  }, [])

  const updateProfile = useCallback(
    (patch: Partial<Pick<User, 'displayName' | 'city' | 'country'>>) => {
      setUser((prev) => {
        if (!prev) return prev
        const next = { ...prev, ...patch }
        if (patch.displayName) next.avatar = initials(patch.displayName)
        void syncUserProfile(next)
        return next
      })
    },
    [],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        recordMatch,
        updateProfile,
        addCoins,
        spendCoins,
        unlockSkin,
        setPro,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
