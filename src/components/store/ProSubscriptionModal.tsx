import { useState } from 'react'
import { CheckCircle, CreditCard, Crown, Loader2, Shield, Sparkles } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'

type Step = 'plan' | 'payment' | 'processing' | 'success'

const PRO_FEATURES = [
  'Global matchmaking region filters',
  'Post-game AI Coach tactical reports',
  'Cyberpunk Neon skin glow effects',
  'Priority Blitz arena queue (simulated)',
]

export function ProSubscriptionModal() {
  const { showProModal, closeProModal } = useStore()
  const { user, setPro } = useAuth()
  const [step, setStep] = useState<Step>('plan')
  const [card, setCard] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12/28')
  const [cvc, setCvc] = useState('123')

  if (user?.isPro) return null

  const handleClose = () => {
    setStep('plan')
    closeProModal()
  }

  const pay = () => {
    setStep('processing')
    setTimeout(() => {
      setPro(true)
      setStep('success')
    }, 2200)
  }

  return (
    <Modal open={showProModal} onClose={handleClose} title="Upgrade to Pro" size="lg">
      {step === 'plan' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-amber-900/40 bg-gradient-to-br from-amber-950/80 to-zinc-900 p-5">
            <div className="flex items-center gap-2 text-amber-400">
              <Crown size={22} />
              <span className="text-lg font-bold text-zinc-100">BlitzCheckers Pro</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-zinc-100">
              $4.99
              <span className="text-base font-normal text-zinc-500"> / month</span>
            </p>
            <p className="mt-1 text-sm text-zinc-500">Cancel anytime · simulated Stripe checkout</p>
          </div>
          <ul className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="gold" className="w-full" onClick={() => setStep('payment')}>
            Continue to payment
          </Button>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 p-3">
            <CreditCard className="text-amber-500" size={20} />
            <input
              className="flex-1 bg-transparent text-sm text-zinc-100 outline-none"
              value={card}
              onChange={(e) => setCard(e.target.value)}
              placeholder="Card number"
              aria-label="Card number"
            />
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-sm text-zinc-100"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              aria-label="Expiry"
            />
            <input
              className="w-24 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-sm text-zinc-100"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              placeholder="CVC"
              aria-label="CVC"
            />
          </div>
          <p className="flex items-center gap-1 text-xs text-zinc-500">
            <Shield size={12} /> Secured by Stripe (demo)
          </p>
          <Button variant="gold" className="w-full" onClick={pay}>
            Pay $4.99
          </Button>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
          <p className="mt-4 text-sm text-zinc-400">Processing payment…</p>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle className="mb-4 h-16 w-16 text-emerald-400" />
          <h3 className="text-xl font-bold text-zinc-100">Welcome to Pro!</h3>
          <p className="mt-2 max-w-sm text-sm text-zinc-400">
            AI Coach, ranked filters, and premium neon skins are now unlocked.
          </p>
          <Button className="mt-6 w-full" onClick={handleClose}>
            Start playing
          </Button>
        </div>
      )}
    </Modal>
  )
}
