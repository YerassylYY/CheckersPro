import { Navigate } from 'react-router-dom'
import { Trophy, TrendingUp, Minus, History } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ProBanner } from '../components/store/ProBanner'
import { DailyQuestsBoard } from '../components/gamification/DailyQuestsBoard'

export function DashboardPage() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/auth" replace />

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ProBanner />
      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-xl font-bold text-zinc-100">
          {user.avatar}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{user.displayName}</h1>
          <p className="text-zinc-500">{user.email}</p>
          <p className="text-sm text-zinc-400">
            {user.city}, {user.country}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <DailyQuestsBoard />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Trophy />} label="ELO" value={String(user.elo)} />
        <StatCard icon={<TrendingUp />} label="Wins" value={String(user.wins)} accent="emerald" />
        <StatCard icon={<TrendingUp />} label="Losses" value={String(user.losses)} accent="red" />
        <StatCard icon={<Minus />} label="Draws" value={String(user.draws)} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <History size={20} />
          Match History
        </h2>
        {user.matchHistory.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-8 text-center text-sm text-zinc-500">
            No matches yet. Play Local, AI, or 4-Player to build your record.
          </p>
        ) : (
          <ul className="space-y-2">
            {user.matchHistory.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-zinc-100">vs {m.opponent}</p>
                  <p className="text-xs text-zinc-500">
                    {m.mode} · {m.date}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={
                      m.result === 'win'
                        ? 'font-semibold text-emerald-400'
                        : m.result === 'loss'
                          ? 'font-semibold text-red-400'
                          : 'text-zinc-400'
                    }
                  >
                    {m.result.toUpperCase()}
                  </p>
                  <p className="text-xs tabular-nums text-zinc-500">
                    {m.eloChange > 0 ? '+' : ''}
                    {m.eloChange} ELO
                  </p>
                  {m.accuracy != null && (
                    <p className="text-[10px] text-zinc-600">
                      {m.accuracy}% acc
                      {m.performanceElo != null && ` · ~${m.performanceElo} perf`}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: 'emerald' | 'red'
}) {
  const border =
    accent === 'emerald'
      ? 'border-emerald-900/50'
      : accent === 'red'
        ? 'border-red-900/50'
        : 'border-zinc-800'

  return (
    <div className={`rounded-xl border bg-zinc-900 p-4 ${border}`}>
      <div className="mb-2 text-zinc-500">{icon}</div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-zinc-100">{value}</p>
    </div>
  )
}
