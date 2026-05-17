import { ChevronRight, Trophy } from 'lucide-react'
import { BOT_ROSTER, type BotProfile } from '../../data/bots'

interface BotSelectionProps {
  onSelect: (bot: BotProfile) => void
}

const STYLE_LABEL: Record<BotProfile['style'], string> = {
  casual: 'Learning',
  balanced: 'Club',
  aggressive: 'Aggressive',
  defensive: 'Defensive',
  perfect: 'Engine',
}

export function BotSelection({ onSelect }: BotSelectionProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-500">
          Single Player
        </p>
        <h1 className="text-3xl font-bold text-zinc-100">Choose Your Opponent</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-500">
          Each bot has a unique personality, rating, and trash-talk style — just like Chess.com.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
        {BOT_ROSTER.map((bot) => {
          const Avatar = bot.avatar
          return (
            <button
              key={bot.id}
              type="button"
              onClick={() => onSelect(bot)}
              className="group snap-center shrink-0 w-[min(100%,260px)] rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 text-left transition-all duration-200 hover:border-emerald-700/60 hover:shadow-lg hover:shadow-emerald-950/30 lg:w-auto"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bot.avatarBg} ring-1 ring-white/5`}
                >
                  <Avatar className={bot.avatarColor} size={28} strokeWidth={1.75} />
                </div>
                <span className="rounded-full border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  {STYLE_LABEL[bot.style]}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-bold text-zinc-100 group-hover:text-emerald-300">
                {bot.name}
              </h2>

              <p className="mt-1 flex items-center gap-1 text-sm font-medium text-amber-500">
                <Trophy size={14} />
                {bot.elo} ELO
              </p>

              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                {bot.bio}
              </p>

              <p className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-500 opacity-0 transition-opacity group-hover:opacity-100">
                Play now
                <ChevronRight size={14} />
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
