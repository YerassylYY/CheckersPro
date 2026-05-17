import { useCallback, useEffect, useRef, useState } from 'react'
import type { Player4Id } from '../game/types'

const BLITZ_SECONDS = 3 * 60

export function useBlitzTimer4P(
  enabled: boolean,
  activePlayer: Player4Id | null,
  paused: boolean,
) {
  const [times, setTimes] = useState<Record<Player4Id, number>>({
    1: BLITZ_SECONDS,
    2: BLITZ_SECONDS,
    3: BLITZ_SECONDS,
    4: BLITZ_SECONDS,
  })
  const [flagFallWinner, setFlagFallWinner] = useState<Player4Id | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = useCallback(() => {
    setTimes({ 1: BLITZ_SECONDS, 2: BLITZ_SECONDS, 3: BLITZ_SECONDS, 4: BLITZ_SECONDS })
    setFlagFallWinner(null)
  }, [])

  useEffect(() => {
    if (!enabled || paused || flagFallWinner || !activePlayer) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setTimes((prev) => {
        const next = { ...prev }
        const t = next[activePlayer]
        if (t <= 1) {
          const opponents = ([1, 2, 3, 4] as Player4Id[]).filter((p) => p !== activePlayer)
          setFlagFallWinner(opponents[0])
          next[activePlayer] = 0
          return next
        }
        next[activePlayer] = t - 1
        return next
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled, paused, activePlayer, flagFallWinner])

  const format = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return {
    times,
    format,
    flagFallWinner,
    reset,
  }
}
