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

const STORE_KEY = 'blitzcheckers_store'

export interface BoardSkinTheme {
  id: string
  name: string
  coinPrice: number
  usdCents: number
  preview: string
  gradient: string
  description: string
  boardLight: string
  boardDark: string
  boardFrame: string
  boardGlow: string
  boardBg?: string
  pieceWhite: string
  pieceBlack: string
  crownClass?: string
  neonPieces?: boolean
  frameClass?: string
  gridClass?: string
  soundPreset?: 'default' | 'arcade'
}

export interface PieceSkin extends BoardSkinTheme {
  owned: boolean
}

const SKIN_DEFS: Omit<PieceSkin, 'owned'>[] = [
  {
    id: 'classic',
    name: 'Classic Wood',
    coinPrice: 0,
    usdCents: 0,
    preview: 'CW',
    gradient: 'from-amber-700 to-amber-900',
    description: 'Warm tournament board — free for all players.',
    boardLight: '#f0d9b5',
    boardDark: '#b58863',
    boardFrame: '#8b5a2b',
    boardGlow: 'transparent',
    pieceWhite: 'stone',
    pieceBlack: 'zinc',
    soundPreset: 'default',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    coinPrice: 400,
    usdCents: 499,
    preview: 'CP',
    gradient: 'from-fuchsia-500 via-cyan-400 to-emerald-400',
    description: 'Synthwave grid, glow borders, purple/cyan tokens.',
    boardLight: '#1e1040',
    boardDark: '#0a0218',
    boardFrame: '#22d3ee',
    boardGlow: '0 0 28px rgba(34,211,238,0.45), inset 0 0 12px rgba(192,38,211,0.15)',
    boardBg: 'linear-gradient(135deg, #0d0221 0%, #1a0a2e 50%, #0d0221 100%)',
    pieceWhite: 'neon-cyan',
    pieceBlack: 'neon-fuchsia',
    neonPieces: true,
    frameClass: 'skin-frame-cyber',
    gridClass: 'skin-grid-cyber',
    soundPreset: 'default',
  },
  {
    id: 'regal',
    name: 'Regal Gold',
    coinPrice: 650,
    usdCents: 799,
    preview: 'RG',
    gradient: 'from-amber-400 via-yellow-300 to-amber-600',
    description: 'Gold-leaf frame, dark marble squares, metallic crowns.',
    boardLight: '#3d3832',
    boardDark: '#1c1916',
    boardFrame: '#c9a227',
    boardGlow: '0 0 20px rgba(201,162,39,0.35)',
    boardBg: 'linear-gradient(180deg, #2a2520 0%, #0f0e0c 100%)',
    pieceWhite: 'gold',
    pieceBlack: 'marble',
    crownClass: 'crown-regal',
    frameClass: 'skin-frame-regal',
    gridClass: 'skin-grid-regal',
    soundPreset: 'default',
  },
  {
    id: 'liquid-wood',
    name: 'Liquid Wood',
    coinPrice: 500,
    usdCents: 599,
    preview: 'LW',
    gradient: 'from-amber-900 via-amber-700 to-amber-950',
    description: 'High-gloss mahogany & premium ivory styling.',
    boardLight: '#d4a574',
    boardDark: '#5c3a1e',
    boardFrame: '#3d2814',
    boardGlow: '0 4px 24px rgba(92,58,30,0.4)',
    boardBg: 'linear-gradient(145deg, #4a2f1a 0%, #2a1a0e 100%)',
    pieceWhite: 'mahogany-light',
    pieceBlack: 'mahogany-dark',
    frameClass: 'skin-frame-wood',
    gridClass: 'skin-grid-wood',
    soundPreset: 'default',
  },
  {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    coinPrice: 450,
    usdCents: 549,
    preview: '8B',
    gradient: 'from-pink-500 via-purple-500 to-indigo-600',
    description: '8-bit borders, low-poly tokens, chiptune clicks.',
    boardLight: '#2d1b69',
    boardDark: '#0f0a24',
    boardFrame: '#ff6bcb',
    boardGlow: '4px 4px 0 #000',
    boardBg: '#1a1035',
    pieceWhite: 'pixel-white',
    pieceBlack: 'pixel-black',
    frameClass: 'skin-frame-arcade',
    gridClass: 'skin-grid-arcade',
    soundPreset: 'arcade',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Nebula',
    coinPrice: 550,
    usdCents: 649,
    preview: 'NB',
    gradient: 'from-indigo-600 via-violet-600 to-fuchsia-700',
    description: 'Deep space canvas with starlight square filters.',
    boardLight: '#2e1065',
    boardDark: '#0c0419',
    boardFrame: '#818cf8',
    boardGlow: '0 0 32px rgba(129,140,248,0.25)',
    boardBg: 'radial-gradient(ellipse at 50% 0%, #312e81 0%, #0c0419 70%)',
    pieceWhite: 'cosmic-light',
    pieceBlack: 'cosmic-dark',
    frameClass: 'skin-frame-cosmic',
    gridClass: 'skin-grid-cosmic',
    soundPreset: 'default',
  },
]

interface StorePersist {
  skins: PieceSkin[]
  activeSkinId: string
  unlockedSkins: string[]
}

export type PurchaseResult =
  | { ok: true }
  | { ok: false; error: string }

interface StoreContextValue {
  skins: PieceSkin[]
  activeSkin: PieceSkin
  activeSkinId: string
  unlockedSkins: string[]
  purchaseError: string | null
  showStripeModal: boolean
  showProModal: boolean
  pendingSkin: PieceSkin | null
  setActiveSkinId: (id: string) => void
  purchaseSkin: (skin: PieceSkin, method?: 'coins' | 'usd') => PurchaseResult
  clearPurchaseError: () => void
  openStripeCheckout: (skin: PieceSkin) => void
  closeStripeModal: () => void
  completePurchase: () => void
  openProModal: () => void
  closeProModal: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

function mergeSkins(
  stored: PieceSkin[] | undefined,
  unlockedIds: string[],
): PieceSkin[] {
  return SKIN_DEFS.map((def) => {
    const prev = stored?.find((s) => s.id === def.id)
    const owned =
      def.id === 'classic' ||
      prev?.owned === true ||
      unlockedIds.includes(def.id)
    return { ...def, owned }
  })
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, spendCoins, unlockSkin: unlockSkinOnProfile } = useAuth()
  const [skins, setSkins] = useState<PieceSkin[]>(() => {
    const stored = loadFromStorage<StorePersist>(STORE_KEY)
    const unlocked = stored?.unlockedSkins ?? ['classic']
    return mergeSkins(stored?.skins, unlocked)
  })
  const [activeSkinId, setActiveSkinId] = useState(() => {
    const stored = loadFromStorage<StorePersist>(STORE_KEY)
    return stored?.activeSkinId ?? 'classic'
  })
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const stored = loadFromStorage<StorePersist>(STORE_KEY)
    return stored?.unlockedSkins ?? ['classic']
  })
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [showStripeModal, setShowStripeModal] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [pendingSkin, setPendingSkin] = useState<PieceSkin | null>(null)

  useEffect(() => {
    const profileUnlocked = user?.unlockedSkins
    if (profileUnlocked?.length) {
      setSkins((prev) => mergeSkins(prev, profileUnlocked))
      setUnlockedSkins((prev) => [
        ...new Set([...prev, ...profileUnlocked]),
      ])
    }
  }, [user?.unlockedSkins])

  useEffect(() => {
    saveToStorage(STORE_KEY, { skins, activeSkinId, unlockedSkins })
  }, [skins, activeSkinId, unlockedSkins])

  const activeSkin = useMemo(
    () => skins.find((s) => s.id === activeSkinId) ?? skins[0],
    [skins, activeSkinId],
  )

  const clearPurchaseError = useCallback(() => setPurchaseError(null), [])

  const markOwned = useCallback(
    (skinId: string) => {
      setSkins((prev) =>
        prev.map((s) => (s.id === skinId ? { ...s, owned: true } : s)),
      )
      setUnlockedSkins((prev) =>
        prev.includes(skinId) ? prev : [...prev, skinId],
      )
      unlockSkinOnProfile(skinId)
    },
    [unlockSkinOnProfile],
  )

  const openStripeCheckout = useCallback((skin: PieceSkin) => {
    setPendingSkin(skin)
    setShowStripeModal(true)
    setPurchaseError(null)
  }, [])

  const closeStripeModal = useCallback(() => {
    setShowStripeModal(false)
    setPendingSkin(null)
  }, [])

  const completePurchase = useCallback(() => {
    if (!pendingSkin) return
    markOwned(pendingSkin.id)
    setActiveSkinId(pendingSkin.id)
    closeStripeModal()
  }, [pendingSkin, markOwned, closeStripeModal])

  const purchaseSkin = useCallback(
    (skin: PieceSkin, method: 'coins' | 'usd' = 'coins'): PurchaseResult => {
      setPurchaseError(null)

      if (skin.owned) {
        setActiveSkinId(skin.id)
        return { ok: true }
      }

      if (!user) {
        const err = 'Sign in to purchase skins with Checkers Coins.'
        setPurchaseError(err)
        return { ok: false, error: err }
      }

      if (method === 'usd' || skin.coinPrice === 0) {
        if (skin.coinPrice === 0) {
          markOwned(skin.id)
          setActiveSkinId(skin.id)
          return { ok: true }
        }
        openStripeCheckout(skin)
        return { ok: true }
      }

      if (user.points < skin.coinPrice) {
        const err = `Need ${skin.coinPrice} coins — you have ${user.points}. Win games (+25) or complete quests.`
        setPurchaseError(err)
        return { ok: false, error: err }
      }

      if (!spendCoins(skin.coinPrice)) {
        const err = 'Purchase failed — could not deduct coins. Try again.'
        setPurchaseError(err)
        return { ok: false, error: err }
      }

      markOwned(skin.id)
      setActiveSkinId(skin.id)
      return { ok: true }
    },
    [user, spendCoins, openStripeCheckout, markOwned],
  )

  const openProModal = useCallback(() => setShowProModal(true), [])
  const closeProModal = useCallback(() => setShowProModal(false), [])

  return (
    <StoreContext.Provider
      value={{
        skins,
        activeSkin,
        activeSkinId,
        unlockedSkins,
        purchaseError,
        showStripeModal,
        showProModal,
        pendingSkin,
        setActiveSkinId,
        purchaseSkin,
        clearPurchaseError,
        openStripeCheckout,
        closeStripeModal,
        completePurchase,
        openProModal,
        closeProModal,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
