const PROFILE_KEY = 'blitzcheckers_profile'

export function loadFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn('[storage] Failed to persist', key)
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

export { PROFILE_KEY }
