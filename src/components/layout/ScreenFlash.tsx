import { usePreferences } from '../../context/PreferencesContext'

export function ScreenFlash() {
  const { flashEvent, accessibilityFeedback } = usePreferences()
  if (!accessibilityFeedback || !flashEvent) return null

  const color =
    flashEvent === 'capture'
      ? 'border-emerald-400/70 shadow-[inset_0_0_80px_rgba(52,211,153,0.15)]'
      : 'border-rose-500/70 shadow-[inset_0_0_80px_rgba(244,63,94,0.15)]'

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[100] animate-pulse border-4 ${color}`}
      aria-hidden
    />
  )
}
