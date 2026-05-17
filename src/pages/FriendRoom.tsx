import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check, Copy, Loader2, Users, Wifi, WifiOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { RulesVariantPicker } from '../components/game/RulesVariantPicker'
import { useMultiplayer } from '../context/MultiplayerContext'
import { useAuth } from '../context/AuthContext'
import { buildRoomLink, buildSpectateLink } from '../lib/roomLink'
import { normalizeRoomCode } from '../lib/roomCode'

export function FriendRoom() {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const mp = useMultiplayer()
  const [copied, setCopied] = useState(false)
  const [joining, setJoining] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const code = normalizeRoomCode(roomId) ?? ''
  const isSpectate = searchParams.get('spectate') === 'true'
  const link = code ? buildRoomLink(code) : ''
  const spectateLink = code ? buildSpectateLink(code) : ''

  const isHost = mp.roomCode === code && mp.isHost
  const lobbyReady = mp.lobbyStatus === 'ready' && !!mp.opponentProfile

  useEffect(() => {
    if (!code) {
      setError('Invalid room code')
      setJoining(false)
      return
    }

    if (isSpectate) {
      navigate(`/play/online/${code}?spectate=true`, { replace: true })
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const wantsHost = searchParams.get('host') === '1'
        if (mp.roomCode === code && mp.isConnected) {
          if (!cancelled) setJoining(false)
          return
        }
        await mp.joinRoom(code, wantsHost)
        if (!cancelled) setJoining(false)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not join room')
          setJoining(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [code, mp.roomCode, mp.isConnected, mp.joinRoom, searchParams, isSpectate, navigate])

  useEffect(() => {
    if (mp.matchStarted && code) {
      navigate(`/play/online/${code}`)
    }
  }, [mp.matchStarted, code, navigate])

  const copyLink = async () => {
    if (!code) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (joining) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <p className="text-sm text-zinc-500">Joining room {code}…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-red-400">{error}</p>
        <Button className="mt-4" onClick={() => navigate('/play/online')}>
          Back to lobby
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-center text-2xl font-bold text-zinc-100">
        {isHost ? 'Your Private Lobby' : 'Friend Match Lobby'}
      </h1>
      <p className="mt-2 flex items-center justify-center gap-1 text-center text-sm text-zinc-500">
        {mp.usingSupabase ? <Wifi size={14} /> : <WifiOff size={14} />}
        {mp.usingSupabase
          ? 'Live sync via Supabase Realtime'
          : 'Local fallback channel (add Supabase keys for WAN play)'}
      </p>

      <div className="mt-8 rounded-xl border border-emerald-900/40 bg-zinc-900 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Room code
        </p>
        <p className="mt-1 font-mono text-2xl tracking-widest text-emerald-400">
          {code}
        </p>
        <p className="mt-3 break-all rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
          {link}
        </p>
        <Button className="mt-4 w-full" variant="secondary" onClick={copyLink}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy invite link'}
        </Button>
        <Button
          className="mt-2 w-full"
          variant="ghost"
          onClick={async () => {
            await navigator.clipboard.writeText(spectateLink)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        >
          Copy spectate link
        </Button>
      </div>

      {isHost && (
        <div className="mt-4">
          <RulesVariantPicker
            value={mp.rulesVariant}
            onChange={mp.setLobbyRulesVariant}
            disabled={lobbyReady && mp.matchStarted}
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 text-center">
          <p className="text-sm font-medium text-zinc-200">
            {user?.displayName ?? 'You'}
          </p>
          <p className="text-xs text-emerald-400">
            {isHost ? 'Host · White' : 'Guest · Black'}
          </p>
          <p className="text-[10px] text-zinc-600">{user?.elo ?? 1200} ELO</p>
        </div>
        <div
          className={`rounded-lg border p-4 text-center ${
            lobbyReady
              ? 'border-emerald-800 bg-emerald-950/30'
              : 'border-zinc-700 bg-zinc-800/50'
          }`}
        >
          <p className="text-sm font-medium text-zinc-200">
            {mp.opponentProfile?.displayName ?? 'Waiting…'}
          </p>
          {lobbyReady && mp.opponentProfile ? (
            <p className="flex items-center justify-center gap-1 text-xs text-emerald-400">
              <Users size={12} /> {mp.opponentProfile.elo} ELO
            </p>
          ) : (
            <p className="flex items-center justify-center gap-1 text-xs text-zinc-500">
              <Loader2 size={12} className="animate-spin" /> Waiting for friend…
            </p>
          )}
        </div>
      </div>

      {isHost ? (
        <Button
          className="mt-6 w-full"
          disabled={!lobbyReady}
          onClick={() => void mp.startNetworkMatch().then(() => navigate(`/play/online/${code}`))}
        >
          Start Blitz Duel
        </Button>
      ) : (
        <p className="mt-6 text-center text-sm text-zinc-500">
          {lobbyReady
            ? 'Host will start the match…'
            : 'Connected — waiting for host to start'}
        </p>
      )}
    </div>
  )
}
