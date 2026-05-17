import { CreditCard, Loader2, Shield, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useStore } from '../../context/StoreContext'

export function StripeModal() {
  const { showStripeModal, pendingSkin, closeStripeModal, completePurchase } =
    useStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!pendingSkin) return null

  const handlePay = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setTimeout(() => {
        completePurchase()
        setSuccess(false)
      }, 1400)
    }, 1800)
  }

  const handleClose = () => {
    setLoading(false)
    setSuccess(false)
    closeStripeModal()
  }

  return (
    <Modal open={showStripeModal} onClose={handleClose} title="Secure Checkout" size="md">
      {success ? (
        <div className="flex flex-col items-center py-8">
          <CheckCircle className="mb-3 h-14 w-14 text-emerald-400" />
          <p className="font-semibold text-zinc-100">{pendingSkin.name} unlocked!</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="mt-4 text-sm text-zinc-400">Processing payment…</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Skin: <strong className="text-zinc-100">{pendingSkin.name}</strong>
          </p>
          <p className="text-2xl font-bold text-emerald-400">
            ${(pendingSkin.usdCents / 100).toFixed(2)}
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 p-3">
            <CreditCard className="text-emerald-400" size={18} />
            <input
              className="flex-1 bg-transparent text-sm outline-none"
              defaultValue="4242 4242 4242 4242"
              aria-label="Card"
            />
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm"
              defaultValue="12/28"
              aria-label="Expiry"
            />
            <input
              className="w-20 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm"
              defaultValue="123"
              aria-label="CVC"
            />
          </div>
          <p className="flex items-center gap-1 text-xs text-zinc-500">
            <Shield size={12} /> Secured by Stripe (demo)
          </p>
          <Button className="w-full" onClick={handlePay}>
            Pay now
          </Button>
        </div>
      )}
    </Modal>
  )
}
