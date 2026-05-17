import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { loadFromStorage, saveToStorage } from '../lib/storage'

const PREFS_KEY = 'blitzcheckers_prefs'

export type AppTheme = 'dark' | 'light'

interface PrefsState {
  theme: AppTheme
  kidsMode: boolean
  accessibilityFeedback: boolean
}

interface PreferencesContextValue extends PrefsState {
  flashEvent: 'capture' | 'error' | null
  setTheme: (t: AppTheme) => void
  toggleTheme: () => void
  setKidsMode: (v: boolean) => void
  setAccessibilityFeedback: (v: boolean) => void
  triggerFlash: (type: 'capture' | 'error') => void
}

const DEFAULT: PrefsState = {
  theme: 'dark',
  kidsMode: false,
  accessibilityFeedback: false,
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<PrefsState>(() => {
    const stored = loadFromStorage<PrefsState>(PREFS_KEY)
    return stored ? { ...DEFAULT, ...stored } : DEFAULT
  })
  const [flashEvent, setFlashEvent] = useState<'capture' | 'error' | null>(null)

  useEffect(() => {
    saveToStorage(PREFS_KEY, prefs)
    document.documentElement.setAttribute('data-theme', prefs.theme)
    document.documentElement.setAttribute(
      'data-kids',
      prefs.kidsMode ? 'true' : 'false',
    )
  }, [prefs])

  const persist = useCallback((patch: Partial<PrefsState>) => {
    setPrefs((p) => ({ ...p, ...patch }))
  }, [])

  const setTheme = useCallback(
    (theme: AppTheme) => persist({ theme }),
    [persist],
  )

  const toggleTheme = useCallback(() => {
    setPrefs((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))
  }, [])

  const triggerFlash = useCallback((type: 'capture' | 'error') => {
    setFlashEvent(type)
    window.setTimeout(() => setFlashEvent(null), 420)
  }, [])

  return (
    <PreferencesContext.Provider
      value={{
        ...prefs,
        flashEvent,
        setTheme,
        toggleTheme,
        setKidsMode: (kidsMode) => persist({ kidsMode }),
        setAccessibilityFeedback: (accessibilityFeedback) =>
          persist({ accessibilityFeedback }),
        triggerFlash,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider')
  }
  return ctx
}
