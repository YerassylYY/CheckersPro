import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Copy,
  Users,
  Link2,
  Check,
  Crown,
  Loader2,
  Wifi,
  Bot,
  Globe,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../context/StoreContext'
import { useMultiplayer } from '../../context/MultiplayerContext'
import { buildRoomLink, copyRoomLink } from '../../lib/roomLink'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  startMatchmaking,
  stopMatchmaking,
  MATCHMAKING_TIMEOUT_MS,
} from '../../lib/multiplayer/matchmaking'

const REGIONS = ['Global', 'Almaty', 'Astana', 'Shchuchinsk'] as const

export function OnlineLobby() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openProModal } = useStore()
  const mp = useMultiplayer()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [searching, setSearching] = useState(false)
  const [queueHint, setQueueHint] = useState<string | null>(null)
  const [showAiFallback, setShowAiFallback] = useState(false)
  const [region, setRegion] = useState<(typeof REGIONS)[number]>('Global')
  const searchingRef = useRef(false)

  useEffect(() => {
    searchingRef.current = searching
  }, [searching])

  useEffect(() => {
    return () => {
      void stopMatchmaking()
    }
  }, [])

  const createFriendRoom = async () => {
    setCreating(true)
    try {
      const code = await mp.createRoom()
      setRoomCode(code)
      await copyRoomLink(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      navigate(`/room/${code}?host=1`)
    } catch {
      setCreating(false)
    }
  }

  const findGlobalMatch = async () => {
    if (!user) return
    setSearching(true)
    setShowAiFallback(false)
    setQueueHint('Searching global queue…')
    const fallbackTimer = window.setTimeout(() => {
      if (searchingRef.current) setShowAiFallback(true)
    }, MATCHMAKING_TIMEOUT_MS)

    try {
      await startMatchmaking(
        {
          userId: user.id,
          displayName: user.displayName,
          avatar: user.avatar,
          elo: user.elo,
        },
        {
          onMatchFound: async (code, asHost) => {
            window.clearTimeout(fallbackTimer)
            setSearching(false)
            setQueueHint(null)
            await mp.joinRoom(code, asHost)
            if (asHost) {
              await mp.startNetworkMatch()
              navigate(`/play/online/${code}?host=1`)
            } else {
              navigate(`/play/online/${code}`)
            }
          },
          onQueueUpdate: (n) => {
            setQueueHint(
              n > 0 ? `${n} player(s) in queue — matching…` : 'Searching global queue…',
            )
          },
          onError: (msg) => {
            if (msg === 'timeout') {
              setQueueHint('No opponents found yet.')
              setShowAiFallback(true)
            }
            setSearching(false)
            window.clearTimeout(fallbackTimer)
          },
        },
      )
    } catch {
      setSearching(false)
      setShowAiFallback(true)
      window.clearTimeout(fallbackTimer)
    }
  }

  const cancelSearch = async () => {
    await stopMatchmaking()
    setSearching(false)
    setShowAiFallback(false)
    setQueueHint(null)
  }

  const copyLink = async () => {
    if (!roomCode) return
    await copyRoomLink(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const roomLink = roomCode ? buildRoomLink(roomCode) : ''

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <h2 className="text-xl font-bold text-zinc-100">Play Online</h2>
      <p className="text-sm text-zinc-500">
        Ranked global matchmaking or private invite links with live sync.
      </p>

      {isSupabaseConfigured() ? (
        <p className="flex items-center gap-1 text-xs text-cyan-400">
          <Wifi size={12} /> Supabase Realtime · global_matchmaking channel
        </p>
      ) : (
        <p className="text-xs text-amber-500/90">
          Offline transport fallback — add Supabase keys for WAN matchmaking.
        </p>
      )}

      <Button
        onClick={findGlobalMatch}
        className="w-full"
        variant="gold"
        disabled={searching || !user}
      >
        {searching ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {queueHint ?? 'Finding opponent…'}
          </>
        ) : (
          <>
            <Globe size={18} />
            Find Global Match
          </>
        )}
      </Button>

      {searching && (
        <Button variant="ghost" className="w-full text-xs" onClick={cancelSearch}>
          Cancel search
        </Button>
      )}

      {showAiFallback && (
        <div className="rounded-xl border border-violet-900/40 bg-violet-950/30 p-4">
          <p className="text-sm text-violet-200">No players in queue after 10s.</p>
          <Button
            className="mt-3 w-full"
            variant="secondary"
            onClick={() => {
              void cancelSearch()
              navigate('/play/ai')
            }}
          >
            <Bot size={16} />
            Play against AI Bot
          </Button>
        </div>
      )}

      <div className="relative border-t border-zinc-800 pt-4">
        <p className="mb-3 text-center text-xs text-zinc-600">or private match</p>
        <Button onClick={createFriendRoom} className="w-full" disabled={creating}>
          {creating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating room…
            </>
          ) : (
            <>
              <Link2 size={18} />
              Play with a Friend — Create Room
            </>
          )}
        </Button>
      </div>

      {roomCode && (
        <div className="rounded-xl border border-emerald-900/40 bg-zinc-950 p-4">
          <p className="text-xs text-zinc-500">Room code (copied)</p>
          <p className="mt-1 font-mono text-2xl tracking-widest text-emerald-400">
            {roomCode}
          </p>
          <p className="mt-2 break-all font-mono text-sm text-zinc-500">{roomLink}</p>
          <Button variant="secondary" onClick={copyLink} className="mt-3 w-full">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy again'}
          </Button>
        </div>
      )}

      <div className="border-t border-zinc-800 pt-4">
        <p className="mb-2 text-sm font-medium text-zinc-300">Matchmaking region</p>
        {!user?.isPro && (
          <p className="mb-2 flex items-center gap-1 text-xs text-amber-500">
            <Crown size={12} /> Pro unlocks all region filters
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => {
            const locked = r !== 'Global' && !user?.isPro
            return (
              <button
                key={r}
                type="button"
                disabled={locked}
                onClick={() => {
                  if (locked) openProModal()
                  else setRegion(r)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  region === r
                    ? 'bg-emerald-700 text-white'
                    : locked
                      ? 'cursor-not-allowed bg-zinc-800 text-zinc-600'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {r}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <div className="text-center">
          <Users className="mx-auto text-zinc-500" size={20} />
          <p className="mt-1 text-sm text-zinc-300">Queue</p>
          <p className="text-xs text-zinc-600">{region} · live PvP</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-400">3:00</p>
          <p className="text-xs text-zinc-600">Blitz clock</p>
        </div>
      </div>
    </div>
  )
}