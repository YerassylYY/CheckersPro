import { CheckCircle2, Coins, Gift } from 'lucide-react'
import { useGamification } from '../../context/GamificationContext'
import { Button } from '../ui/Button'

export function DailyQuestsBoard() {
  const { quests, claimQuest } = useGamification()

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-zinc-100">
        <Gift className="text-amber-500" size={20} />
        Daily Quests
      </h2>
      <p className="mb-4 text-xs text-zinc-500">Resets at midnight · +50 Checkers Coins each</p>
      <ul className="space-y-3">
        {quests.map((q) => (
          <li
            key={q.id}
            className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-zinc-200">{q.title}</p>
                <p className="text-xs text-zinc-500">{q.description}</p>
              </div>
              {q.claimed ? (
                <CheckCircle2 className="shrink-0 text-emerald-500" size={20} />
              ) : (
                <span className="flex shrink-0 items-center gap-1 text-xs text-amber-500">
                  <Coins size={12} /> +50
                </span>
              )}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              {q.progress} / {q.target}
            </p>
            {q.completed && !q.claimed && (
              <Button
                className="mt-3 w-full text-xs"
                variant="gold"
                onClick={() => claimQuest(q.id)}
              >
                Claim reward
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
