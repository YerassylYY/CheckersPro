import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { BotProfile } from '../../data/bots'
import { botToLegacyDifficulty } from '../../data/bots'
import { useGame } from '../../context/GameContext'
import { useBotChat } from '../../hooks/useBotChat'
import { GameSession } from './GameSession'
import { BotChat } from './BotChat'
import { Button } from '../ui/Button'

interface AiGameSessionProps {
  bot: BotProfile
  onBack: () => void
}

export function AiGameSession({ bot, onBack }: AiGameSessionProps) {
  const {
    moveHistory,
    winner,
    setAiDifficulty,
    setSelectedBot,
    registerHumanBlunder,
    resetGame,
  } = useGame()

  const chat = useBotChat(bot)
  const greetedRef = useRef(false)
  const processedMovesRef = useRef(0)
  const winnerHandledRef = useRef(false)

  useEffect(() => {
    setSelectedBot(bot)
    setAiDifficulty(botToLegacyDifficulty(bot))
    greetedRef.current = false
    processedMovesRef.current = 0
    winnerHandledRef.current = false
    chat.resetChat()
    resetGame()
    registerHumanBlunder(() => chat.onBlunder())
    return () => registerHumanBlunder(null)
  }, [bot.id])

  useEffect(() => {
    if (moveHistory.length <= processedMovesRef.current) return

    for (let i = processedMovesRef.current; i < moveHistory.length; i++) {
      const turn = moveHistory[i]
      const totalCaps = turn.steps.reduce(
        (n, s) => n + (s.captured?.length ?? 0),
        0,
      )
      if (totalCaps === 0) continue

      if (turn.player === 1) {
        chat.onUserCapture()
      } else if (turn.player === 2) {
        chat.onBotCapture(turn.steps.length > 1 || totalCaps > 1)
      }
    }

    processedMovesRef.current = moveHistory.length
  }, [moveHistory, chat])

  useEffect(() => {
    if (!winner || winnerHandledRef.current) return
    winnerHandledRef.current = true
    if (winner === 1) chat.onLose()
    else chat.onWin()
  }, [winner, chat])

  const handleGameStarted = () => {
    if (!greetedRef.current) {
      greetedRef.current = true
      chat.sendGreeting()
    }
  }

  const Avatar = bot.avatar

  return (
    <div className="mx-auto max-w-6xl px-2 py-4 sm:px-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button variant="ghost" className="text-xs" onClick={onBack}>
          <ArrowLeft size={14} />
          Change opponent
        </Button>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${bot.avatarBg}`}
          >
            <Avatar className={bot.avatarColor} size={16} />
          </div>
          <div className="text-right sm:text-left">
            <p className="text-sm font-semibold text-zinc-100">{bot.name}</p>
            <p className="text-xs text-amber-500">{bot.elo} ELO</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="min-w-0 flex-1">
          <GameSession aiBot={bot} onGameStarted={handleGameStarted} />
        </div>
        <div className="w-full shrink-0 lg:w-80 xl:w-96">
          <BotChat
            bot={bot}
            messages={chat.messages}
            isTyping={chat.isTyping}
            scrollRef={chat.scrollRef}
          />
        </div>
      </div>
    </div>
  )
}
