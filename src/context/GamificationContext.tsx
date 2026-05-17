import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { loadFromStorage, saveToStorage } from '../lib/storage'

const QUESTS_KEY = 'blitzcheckers_daily_quests'
const COINS_PER_WIN = 25
const QUEST_REWARD = 50

export interface DailyQuest {
  id: string
  title: string
  description: string
  target: number
  progress: number
  completed: boolean
  claimed: boolean
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function defaultQuests(): DailyQuest[] {
  return [
    {
      id: 'win-ai-intermediate',
      title: 'AI Challenger',
      description: 'Win 2 games vs Intermediate AI',
      target: 2,
      progress: 0,
      completed: false,
      claimed: false,
    },
    {
      id: 'capture-five',
      title: 'Capture Storm',
      description: 'Capture 5 pieces in a single match',
      target: 5,
      progress: 0,
      completed: false,
      claimed: false,
    },
    {
      id: 'play-blitz',
      title: 'Blitz Runner',
      description: 'Finish 1 Checkers Blitz duel (3 min)',
      target: 1,
      progress: 0,
      completed: false,
      claimed: false,
    },
  ]
}

interface StoredQuests {
  date: string
  quests: DailyQuest[]
  sessionCaptures: number
}

interface GamificationContextValue {
  quests: DailyQuest[]
  sessionCaptures: number
  addSessionCaptures: (n: number) => void
  resetSessionCaptures: () => void
  recordAiWin: (difficulty: string) => void
  recordBlitzComplete: () => void
  claimQuest: (id: string) => void
  coinsEarnedOnWin: number
}

const GamificationContext = createContext<GamificationContextValue | null>(null)

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { addCoins } = useAuth()
  const [stored, setStored] = useState<StoredQuests>(() => {
    const raw = loadFromStorage<StoredQuests>(QUESTS_KEY)
    if (raw?.date === todayKey()) return raw
    return { date: todayKey(), quests: defaultQuests(), sessionCaptures: 0 }
  })

  useEffect(() => {
    if (stored.date !== todayKey()) {
      setStored({
        date: todayKey(),
        quests: defaultQuests(),
        sessionCaptures: 0,
      })
    }
  }, [stored.date])

  useEffect(() => {
    saveToStorage(QUESTS_KEY, stored)
  }, [stored])

  const bumpQuest = useCallback((id: string, amount = 1) => {
    setStored((s) => ({
      ...s,
      quests: s.quests.map((q) => {
        if (q.id !== id || q.completed) return q
        const progress = Math.min(q.target, q.progress + amount)
        return { ...q, progress, completed: progress >= q.target }
      }),
    }))
  }, [])

  const addSessionCaptures = useCallback((n: number) => {
    setStored((s) => {
      const sessionCaptures = s.sessionCaptures + n
      const quests = s.quests.map((q) => {
        if (q.id !== 'capture-five' || q.completed) return q
        const progress = Math.min(q.target, sessionCaptures)
        return { ...q, progress, completed: progress >= q.target }
      })
      return { ...s, sessionCaptures, quests }
    })
  }, [])

  const resetSessionCaptures = useCallback(() => {
    setStored((s) => ({ ...s, sessionCaptures: 0 }))
  }, [])

  const recordAiWin = useCallback(
    (difficulty: string) => {
      if (difficulty === 'intermediate') bumpQuest('win-ai-intermediate')
    },
    [bumpQuest],
  )

  const recordBlitzComplete = useCallback(() => {
    bumpQuest('play-blitz')
  }, [bumpQuest])

  const claimQuest = useCallback(
    (id: string) => {
      setStored((s) => {
        const q = s.quests.find((x) => x.id === id)
        if (!q || !q.completed || q.claimed) return s
        addCoins(QUEST_REWARD)
        return {
          ...s,
          quests: s.quests.map((x) =>
            x.id === id ? { ...x, claimed: true } : x,
          ),
        }
      })
    },
    [addCoins],
  )

  const value = useMemo(
    () => ({
      quests: stored.quests,
      sessionCaptures: stored.sessionCaptures,
      addSessionCaptures,
      resetSessionCaptures,
      recordAiWin,
      recordBlitzComplete,
      claimQuest,
      coinsEarnedOnWin: COINS_PER_WIN,
    }),
    [
      stored,
      addSessionCaptures,
      resetSessionCaptures,
      recordAiWin,
      recordBlitzComplete,
      claimQuest,
    ],
  )

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  )
}

export function useGamification() {
  const ctx = useContext(GamificationContext)
  if (!ctx) {
    throw new Error('useGamification must be used within GamificationProvider')
  }
  return ctx
}

export { COINS_PER_WIN, QUEST_REWARD }
