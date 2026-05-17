import { useEffect, useState } from 'react'
import { BotSelection } from '../components/game/BotSelection'
import { AiGameSession } from '../components/game/AiGameSession'
import { useGame } from '../context/GameContext'
import type { BotProfile } from '../data/bots'

export function PlayAI() {
  const { setMode, setSelectedBot, resetGame } = useGame()
  const [activeBot, setActiveBot] = useState<BotProfile | null>(null)

  useEffect(() => {
    setMode('ai')
  }, [setMode])

  const handleSelect = (bot: BotProfile) => {
    setSelectedBot(bot)
    setActiveBot(bot)
    resetGame()
  }

  const handleBack = () => {
    setActiveBot(null)
    setSelectedBot(null)
    resetGame()
  }

  if (!activeBot) {
    return <BotSelection onSelect={handleSelect} />
  }

  return <AiGameSession bot={activeBot} onBack={handleBack} />
}
