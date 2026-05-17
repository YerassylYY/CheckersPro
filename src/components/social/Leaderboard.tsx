import { useState } from 'react'
import { Search, Loader2, WifiOff } from 'lucide-react'
import {
  REGIONAL_COMPETITORS,
  type LeaderboardTab,
} from '../../data/leaderboardCompetitors'
import { useLeaderboard } from '../../hooks/useLeaderboard'

const TABS: { id: LeaderboardTab; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'Almaty', label: 'Almaty' },
  { id: 'Shchuchinsk', label: 'Shchuchinsk' },
  { id: 'Astana', label: 'Astana' },
]

export function Leaderboard() {
  const [tab, setTab] = useState<LeaderboardTab>('global')
  const [search, setSearch] = useState('')
  const { rows, loading, isOffline } = useLeaderboard(tab, search)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {isOffline ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-900/50 bg-amber-950/40 px-2.5 py-1 text-xs font-medium text-amber-400">
            <WifiOff size={12} />
            Offline Mode · {REGIONAL_COMPETITORS.length} regional masters
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-900/50 bg-cyan-950/30 px-2.5 py-1 text-xs font-medium text-cyan-400">
            Live database · top 50 by ELO
          </span>
        )}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username…"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              tab === id
                ? 'border-emerald-600 bg-emerald-600/15 text-white'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading rankings…
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-500">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">ELO</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Wins</th>
                <th className="px-4 py-3 font-medium">City</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No players match your search.
                  </td>
                </tr>
              ) : (
                rows.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-zinc-800/80 transition-colors hover:bg-zinc-800/50 ${
                      entry.isYou ? 'bg-emerald-950/30' : ''
                    } ${entry.rank <= 3 ? 'bg-amber-950/10' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {entry.rank}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-100">
                      {entry.name}
                      {entry.isYou && (
                        <span className="ml-2 text-xs text-emerald-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-zinc-100">
                      {entry.elo}
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums text-zinc-500 sm:table-cell">
                      {entry.wins}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{entry.city}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
