import { ShoppingBag, Coins } from 'lucide-react'
import { CustomizationShop } from '../components/store/CustomizationShop'
import { useAuth } from '../context/AuthContext'

export function ShopPage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-zinc-100">
        <ShoppingBag className="text-emerald-500" />
        Premium Skins Shop
      </h1>
      <p className="mb-2 flex items-center gap-2 text-zinc-500">
        <Coins size={14} className="text-amber-500" />
        {user
          ? `${user.points} Checkers Coins — win games (+25) or complete daily quests (+50)`
          : 'Login to earn Checkers Coins and unlock board themes'}
      </p>
      <p className="mb-6 text-sm text-zinc-600">
        Equip instantly — boards update live on 8×8 and 12×12 arenas.
      </p>
      <CustomizationShop />
    </div>
  )
}
