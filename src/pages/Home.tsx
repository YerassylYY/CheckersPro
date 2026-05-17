import { Link } from 'react-router-dom'
import {
  Swords,
  Bot,
  Users,
  Globe,
  Timer,
  Zap,
  Brain,
  Link2,
  Gift,
  Bomb,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { copyRoomLink, generateRoomId } from '../lib/roomLink'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const modes = [
  {
    to: '/play/blitz',
    icon: Zap,
    title: 'Checkers Blitz',
    desc: '3-minute rapid duels — heartbeat under 20s.',
    highlight: true,
  },
  {
    to: '/play/local',
    icon: Swords,
    title: 'Local 1v1',
    desc: 'Same device, international rules.',
  },
  {
    to: '/play/local?rules=GIVEAWAY',
    icon: Gift,
    title: 'Giveaway (Поддавки)',
    desc: 'Win by losing all pieces or having no moves.',
  },
  {
    to: '/play/local?rules=ATOMIC',
    icon: Bomb,
    title: 'Atomic (Атомные)',
    desc: 'Captures detonate adjacent pieces — kings resist blasts.',
  },
  {
    to: '/play/ai',
    icon: Bot,
    title: 'Bot Opponents',
    desc: '5 unique personalities with live chat — Chess.com style.',
  },
  {
    to: '/play/four',
    icon: Users,
    title: '4-Player Arena',
    desc: 'Cross board — last player standing.',
  },
  {
    to: '/play/online',
    icon: Globe,
    title: 'Online',
    desc: 'Private rooms & ranked matchmaking.',
  },
  {
    to: '/puzzles',
    icon: Brain,
    title: 'Tactical Exercises',
    desc: '3 endgame puzzles · 30s each.',
  },
]

export function Home() {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const createFriendLink = async () => {
    const id = generateRoomId()
    await copyRoomLink(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    navigate(`/room/${id}`)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10 text-center">
        <p className="mb-3 inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400">
          <Timer size={13} />
          Investor-ready · Pro monetization · Daily quests
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--app-text)] sm:text-4xl">
          BlitzCheckers Pro
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--app-muted)]">
          Premium checkers with flying kings, AI coach, skins shop, and P2P friend matches.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/play/blitz">
            <Button variant="gold" className="px-8">
              <Zap size={16} />
              Start Blitz Duel
            </Button>
          </Link>
          <Button variant="secondary" onClick={createFriendLink}>
            <Link2 size={16} />
            {copied ? 'Link copied!' : 'Play with a Friend'}
          </Button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map(({ to, icon: Icon, title, desc, highlight }) => (
          <Link
            key={to}
            to={to}
            className={`rounded-xl border p-5 transition-colors duration-150 hover:border-zinc-700 hover:bg-zinc-800/80 ${
              highlight
                ? 'border-amber-900/50 bg-amber-950/20'
                : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                highlight ? 'bg-amber-900/40 text-amber-400' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <h2 className="font-semibold text-zinc-100">{title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
