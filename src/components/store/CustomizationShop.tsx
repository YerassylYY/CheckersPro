import { useState } from 'react'
import { Check, Lock, Coins, CreditCard, AlertCircle, Sparkles } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'

export function CustomizationShop() {
  const {
    skins,
    activeSkinId,
    purchaseSkin,
    purchaseError,
    clearPurchaseError,
    setActiveSkinId,
  } = useStore()
  const { user } = useAuth()
  const [localMsg, setLocalMsg] = useState<string | null>(null)

  const premiumSkins = skins.filter((s) => s.id !== 'classic')
  const classic = skins.find((s) => s.id === 'classic')

  const handlePurchase = (skin: (typeof skins)[0], method: 'coins' | 'usd') => {
    clearPurchaseError()
    setLocalMsg(null)
    const result = purchaseSkin(skin, method)
    if (!result.ok) setLocalMsg(result.error)
    else if (result.ok && method === 'coins' && !skin.owned)
      setLocalMsg(`Unlocked ${skin.name}! Equipped on all boards.`)
  }

  const displayError = purchaseError ?? localMsg

  return (
    <div className="space-y-6">
      {displayError && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            purchaseError
              ? 'border-red-900/50 bg-red-950/30 text-red-300'
              : 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300'
          }`}
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{displayError}</p>
        </div>
      )}

      {classic && (
        <article className="rounded-2xl border border-zinc-700 bg-zinc-900/90 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${classic.gradient} text-lg font-bold text-white`}
              >
                {classic.preview}
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100">{classic.name}</h3>
                <p className="text-sm text-zinc-500">{classic.description}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              disabled={activeSkinId === classic.id}
              onClick={() => setActiveSkinId(classic.id)}
            >
              {activeSkinId === classic.id ? (
                <>
                  <Check size={16} /> Equipped
                </>
              ) : (
                'Equip'
              )}
            </Button>
          </div>
        </article>
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          <Sparkles size={16} className="text-amber-400" />
          Premium themes
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {premiumSkins.map((skin) => {
            const canAfford = user && user.points >= skin.coinPrice
            return (
              <article
                key={skin.id}
                className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                  activeSkinId === skin.id
                    ? 'border-emerald-600/60 bg-emerald-950/25 ring-1 ring-emerald-600/30'
                    : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 opacity-20 bg-gradient-to-br ${skin.gradient}`}
                  aria-hidden
                />
                <div className="relative">
                  <div
                    className={`mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br ${skin.gradient} text-xl font-bold text-white shadow-xl ring-2 ring-white/10`}
                  >
                    {skin.preview}
                  </div>
                  <h3 className="text-center font-semibold text-zinc-100">
                    {skin.name}
                  </h3>
                  <p className="mt-1 min-h-[2.5rem] text-center text-xs text-zinc-500">
                    {skin.description}
                  </p>
                  <p className="mt-2 text-center text-sm font-medium text-amber-400/90">
                    {skin.coinPrice} coins
                    <span className="text-zinc-600">
                      {' '}
                      · ${(skin.usdCents / 100).toFixed(2)}
                    </span>
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {skin.owned ? (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setActiveSkinId(skin.id)}
                        disabled={activeSkinId === skin.id}
                      >
                        {activeSkinId === skin.id ? (
                          <>
                            <Check size={16} /> Equipped
                          </>
                        ) : (
                          'Equip'
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          className="w-full text-xs"
                          disabled={!user || !canAfford}
                          onClick={() => handlePurchase(skin, 'coins')}
                        >
                          <Coins size={14} />
                          Unlock with coins
                        </Button>
                        <Button
                          variant="secondary"
                          className="w-full text-xs"
                          disabled={!user}
                          onClick={() => handlePurchase(skin, 'usd')}
                        >
                          <CreditCard size={14} />
                          Pay with card
                        </Button>
                        {!canAfford && user && (
                          <p className="flex items-center justify-center gap-1 text-[10px] text-zinc-600">
                            <Lock size={10} />
                            Need {skin.coinPrice - user.points} more coins
                          </p>
                        )}
                        {!user && (
                          <p className="text-center text-[10px] text-zinc-600">
                            Sign in to purchase
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
