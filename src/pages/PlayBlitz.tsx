import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { GameSession } from '../components/game/GameSession'
import { useGame } from '../context/GameContext'
import { parseRulesVariant } from '../lib/rulesVariant'

export function PlayBlitz() {
  const [params] = useSearchParams()
  const { setMode, resetGame, setRulesVariant } = useGame()
  const rules = parseRulesVariant(params.get('rules'))

  useEffect(() => {
    setMode('local')
    setRulesVariant(rules)
    resetGame()
  }, [setMode, resetGame, setRulesVariant, rules])

  return (
    <div className="px-2 py-4">
      <p className="mb-3 flex items-center justify-center gap-2 text-center text-sm font-medium text-amber-400">
        <Zap size={16} />
        Checkers Blitz — 3:00 per player · heartbeat under 0:20
      </p>
      <GameSession blitzMode initialRulesVariant={rules} />
    </div>
  )
}
