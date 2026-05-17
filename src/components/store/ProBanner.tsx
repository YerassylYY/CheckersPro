import { Crown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../context/StoreContext'
import { Button } from '../ui/Button'

export function ProBanner({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth()
  const { openProModal } = useStore()
  if (user?.isPro) return null

  return (
    <div
      className={`flex items-center justify-center gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface)] ${compact ? 'px-4 py-1.5' : 'px-6 py-3'}`}
    >
      <p className={`text-center ${compact ? 'text-xs' : 'text-sm'} text-[var(--app-muted)]`}>
        <span className="font-semibold text-amber-500">Pro</span>
        {' — AI Coach, matchmaking filters & neon skins'}
      </p>
      <Button
        variant="gold"
        className={compact ? 'py-1 px-2.5 text-xs' : 'py-1.5'}
        onClick={openProModal}
      >
        <Crown size={14} />
        Upgrade
      </Button>
    </div>
  )
}
