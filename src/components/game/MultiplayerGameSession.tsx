import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Eye, Flag, Loader2, Send, Wifi, WifiOff } from 'lucide-react'
import { Board8x8 } from '../board/Board8x8'
import { BlitzClock } from './BlitzClock'
import { GameReviewDashboard } from './GameReviewDashboard'
import { VictoryOverlay } from './VictoryOverlay'
import { Button } from '../ui/Button'
import { useGame } from '../../context/GameContext'
import { useMultiplayer } from '../../context/MultiplayerContext'
import { useAuth } from '../../context/AuthContext'
import { useBlitzTimer, BLITZ_DURATION } from '../../hooks/useBlitzTimer'
import { usePostGameReview } from '../../hooks/usePostGameReview'
import { PLAYER_NAMES, type PlayerId } from '../../game/types'
import type { NetworkBroadcastEvent } from '../../lib/multiplayer/events'
import { normalizeRoomCode } from '../../lib/roomCode'

const processedMoveIds = new Set<string>()

export function MultiplayerGameSession() {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const code = normalizeRoomCode(roomId) ?? ''
  const isSpectate = searchParams.get('spectate') === 'true'
  const { user } = useAuth()

  const mp = useMultiplayer()
  const {
    currentPlayer,
    winner,
    moveHistory,
    resetGame,
    setMode,
    setRulesVariant,
    setNetworkSeat,
    applyRemoteMove,
    registerMoveBroadcast,
    applyFlagFall,
  } = useGame()

  const [gameStarted, setGameStarted] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const matchEndRecorded = useRef(false)
  const [lowTimePlayer, setLowTimePlayer] = useState<1 | 2 | null>(null)

  const humanPlayer: PlayerId = mp.localSeat ?? 1
  const spectator = mp.isSpectator || isSpectate

  const timer = useBlitzTimer(true, currentPlayer, !!winner || spectator, {
    durationSeconds: BLITZ_DURATION,
    onLowTime: (_s, p) => setLowTimePlayer(p),
  })

  const {
    report: reviewReport,
    reviewOpen,
    setReviewOpen,
  } = usePostGameReview({
    moveHistory,
    winner: winner ?? null,
    humanPlayer,
    mode: 'online',
    opponentName: mp.opponentProfile?.displayName,
    opponentElo: mp.opponentProfile?.elo,
    userElo: user?.elo,
    skipMatchRecord: true,
  })

  const recordEndOnce = useCallback(
    (result: 'win' | 'loss') => {
      if (matchEndRecorded.current) return
      matchEndRecorded.current = true
      void mp.recordNetworkMatchEnd(result)
    },
    [mp],
  )

  useEffect(() => {
    setMode('online')
    if (spectator) {
      setNetworkSeat(null)
    } else if (mp.localSeat) {
      setNetworkSeat(mp.localSeat)
    }
  }, [setMode, setNetworkSeat, mp.localSeat, spectator])

  useEffect(() => {
    if (spectator) return
    registerMoveBroadcast((step, player, chain) => {
      void mp.sendNetworkMove(step, player, chain)
    })
    return () => registerMoveBroadcast(null)
  }, [registerMoveBroadcast, mp.sendNetworkMove, spectator])

  useEffect(() => {
    if (!code) return
    if (mp.roomCode === code && mp.isConnected) return

    if (spectator) {
      void mp.joinRoomAsSpectator(code).catch(() => navigate('/play/online'))
      return
    }
    void mp.joinRoom(code, searchParams.get('host') === '1').catch(() =>
      navigate('/play/online'),
    )
  }, [
    code,
    mp.roomCode,
    mp.isConnected,
    mp.joinRoom,
    mp.joinRoomAsSpectator,
    navigate,
    spectator,
    searchParams,
  ])

  const onNetworkEvent = useCallback(
    (event: NetworkBroadcastEvent) => {
      switch (event.type) {
        case 'game_start':
          setRulesVariant(event.rulesVariant)
          resetGame()
          setGameStarted(true)
          mp.setNetworkTurn(1)
          timer.reset()
          timer.start()
          break

        case 'move_played': {
          if (processedMoveIds.has(event.moveId)) return
          processedMoveIds.add(event.moveId)
          if (!spectator && mp.localSeat && event.player === mp.localSeat) return
          applyRemoteMove(event.step, event.player)
          break
        }

        case 'player_resigned': {
          if (spectator) break
          const seat = mp.localSeat
          if (!seat || winner) return
          if (event.player !== seat) {
            applyFlagFall(seat)
            recordEndOnce('win')
            setReviewOpen(true)
          }
          break
        }
      }
    },
    [
      applyRemoteMove,
      applyFlagFall,
      mp,
      resetGame,
      setRulesVariant,
      timer,
      winner,
      recordEndOnce,
      setReviewOpen,
      spectator,
    ],
  )

  useEffect(() => {
    mp.registerEventHandler(onNetworkEvent)
    return () => mp.registerEventHandler(null)
  }, [mp, onNetworkEvent])

  useEffect(() => {
    if (mp.matchStarted && !gameStarted && !mp.isHost) {
      setRulesVariant(mp.rulesVariant)
      resetGame()
      setGameStarted(true)
      timer.reset()
      timer.start()
    }
  }, [
    mp.matchStarted,
    mp.isHost,
    mp.rulesVariant,
    gameStarted,
    resetGame,
    setRulesVariant,
    timer,
  ])

  useEffect(() => {
    if (spectator || !winner || !mp.localSeat) return
    const result = winner === mp.localSeat ? 'win' : 'loss'
    recordEndOnce(result)
    setReviewOpen(true)
  }, [winner, mp.localSeat, recordEndOnce, setReviewOpen, spectator])

  useEffect(() => {
    if (gameStarted && !winner) timer.start()
  }, [currentPlayer, gameStarted, winner, timer])

  useEffect(() => {
    mp.setNetworkTurn(currentPlayer)
  }, [currentPlayer, mp])

  const handleResign = async () => {
    await mp.resignMatch()
    const seat = mp.localSeat
    if (seat && !winner) {
      const opp: PlayerId = seat === 1 ? 2 : 1
      applyFlagFall(opp)
      recordEndOnce('loss')
    }
  }

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    await mp.sendNetworkChat(chatInput)
    setChatInput('')
  }

  if (!code) {
    return (
      <p className="py-12 text-center text-zinc-500">Invalid room code.</p>
    )
  }

  if (!mp.isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <p className="text-sm text-zinc-500">Connecting to room {code}…</p>
      </div>
    )
  }

  const isMyTurn = !spectator && mp.localSeat === currentPlayer && !winner

  const playerLine = spectator
    ? mp.livePlayers.length >= 2
      ? `${mp.livePlayers[0]?.displayName} vs ${mp.livePlayers[1]?.displayName}`
      : 'Waiting for players…'
    : mp.opponentProfile
      ? `vs ${mp.opponentProfile.displayName} · ${mp.opponentProfile.elo} ELO`
      : null

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-2 py-3">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span className="flex items-center gap-1 font-mono text-cyan-400">
          {mp.usingSupabase ? <Wifi size={12} /> : <WifiOff size={12} />}
          Room {code}
          {spectator && (
            <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-violet-950/60 px-1.5 py-0.5 text-violet-300">
              <Eye size={10} /> Spectating
            </span>
          )}
        </span>
        {playerLine && <span>{playerLine}</span>}
      </div>

      {mp.disconnectCountdown != null && !spectator && (
        <p className="rounded-lg border border-amber-900/50 bg-amber-950/40 px-3 py-2 text-center text-xs text-amber-300">
          Opponent disconnected — claiming win in {mp.disconnectCountdown}s…
        </p>
      )}

      <BlitzClock
        p1Display={timer.p1Display}
        p2Display={timer.p2Display}
        activePlayer={gameStarted && !winner ? currentPlayer : null}
        urgentPlayer={lowTimePlayer}
      />

      <p className="text-center text-sm text-zinc-400">
        {spectator ? (
          <span className="text-violet-300">Live spectator view</span>
        ) : winner ? (
          <span className="font-semibold text-zinc-100">
            {PLAYER_NAMES[winner]} wins
          </span>
        ) : isMyTurn ? (
          <span className="text-emerald-400">Your turn</span>
        ) : (
          <span>Waiting for opponent…</span>
        )}
      </p>

      <div className={spectator ? 'pointer-events-none select-none' : ''}>
        <Board8x8 />
      </div>

      {!spectator && (
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1 text-xs" onClick={handleResign}>
            <Flag size={14} />
            Resign
          </Button>
          {winner && (
            <Button className="flex-1 text-xs" onClick={() => setReviewOpen(true)}>
              Game Review
            </Button>
          )}
        </div>
      )}

      {!spectator && (
        <form onSubmit={sendChat} className="flex gap-2">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Match chat…"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
        />
        <Button type="submit" variant="secondary" className="px-3">
          <Send size={16} />
        </Button>
      </form>
      )}

      <ul className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/80 p-2 text-xs">
        {mp.chatMessages.length === 0 ? (
          <li className="text-zinc-600">No messages yet.</li>
        ) : (
          mp.chatMessages.map((m) => (
            <li
              key={m.id}
              className={m.isLocal ? 'text-emerald-400/90' : 'text-zinc-400'}
            >
              <span className="font-medium">
                {m.isLocal ? 'You' : m.fromName}:
              </span>{' '}
              {m.text}
            </li>
          ))
        )}
      </ul>

      {winner && !spectator && (
        <VictoryOverlay
          winner={winner}
          reason="Match complete"
          onPlayAgain={() => {
            void mp.leaveRoom()
            navigate('/play/online')
          }}
          onAnalyze={() => setReviewOpen(true)}
          analyzeLabel="Game Review"
        />
      )}

      {!spectator && (
        <GameReviewDashboard
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        history={moveHistory}
        humanPlayer={humanPlayer}
        opponentName={mp.opponentProfile?.displayName ?? 'Opponent'}
        opponentElo={mp.opponentProfile?.elo ?? 1200}
        result={
          winner === humanPlayer ? 'win' : winner ? 'loss' : 'draw'
        }
        initialReport={reviewReport}
        />
      )}
    </div>
  )
}