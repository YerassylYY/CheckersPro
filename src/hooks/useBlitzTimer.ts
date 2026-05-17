import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlayerId } from '../game/types'
import { playHeartbeat } from '../game/sounds'

export const BLITZ_DURATION = 180

export interface BlitzTimerOptions {
  durationSeconds?: number
  onLowTime?: (secondsLeft: number, player: PlayerId) => void
}

export interface BlitzTimerState {
  p1Seconds: number
  p2Seconds: number
  activePlayer: PlayerId | null
  isRunning: boolean
  flagFallWinner: PlayerId | null
}

export function useBlitzTimer(
  enabled: boolean,
  activePlayer: PlayerId | null,
  paused: boolean,
  options: BlitzTimerOptions = {},
) {
  const duration = options.durationSeconds ?? BLITZ_DURATION
  const [p1Seconds, setP1Seconds] = useState(duration)
  const [p2Seconds, setP2Seconds] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const [flagFallWinner, setFlagFallWinner] = useState<PlayerId | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const heartbeatRef = useRef(false)

  const reset = useCallback(() => {
    setP1Seconds(duration)
    setP2Seconds(duration)
    setFlagFallWinner(null)
    setIsRunning(false)
    heartbeatRef.current = false
  }, [duration])

  const start = useCallback(() => setIsRunning(true), [])
  const stop = useCallback(() => setIsRunning(false), [])

  useEffect(() => {
    reset()
  }, [duration, reset])

  useEffect(() => {
    if (!enabled || !isRunning || paused || flagFallWinner || !activePlayer) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      if (activePlayer === 1) {
        setP1Seconds((s) => {
          const next = s <= 1 ? 0 : s - 1
          if (next <= 20 && next > 0) {
            playHeartbeat()
            options.onLowTime?.(next, 1)
          }
          if (s <= 1) {
            setFlagFallWinner(2)
            setIsRunning(false)
          }
          return next
        })
      } else {
        setP2Seconds((s) => {
          const next = s <= 1 ? 0 : s - 1
          if (next <= 20 && next > 0) {
            playHeartbeat()
            options.onLowTime?.(next, 2)
          }
          if (s <= 1) {
            setFlagFallWinner(1)
            setIsRunning(false)
          }
          return next
        })
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled, isRunning, paused, activePlayer, flagFallWinner, options])

  const format = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return {
    p1Seconds,
    p2Seconds,
    p1Display: format(p1Seconds),
    p2Display: format(p2Seconds),
    isRunning,
    flagFallWinner,
    reset,
    start,
    stop,
    setFlagFallWinner,
    duration,
  }
}
