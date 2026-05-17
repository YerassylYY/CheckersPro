import { Trophy } from 'lucide-react'
import { Leaderboard } from '../components/social/Leaderboard'

export function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-zinc-100">
        <Trophy className="text-amber-500" />
        Leaderboard
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Kazakhstan regional rankings — search and filter by city.
      </p>
      <Leaderboard />
    </div>
  )
}
