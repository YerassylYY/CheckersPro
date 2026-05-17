import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GameSession } from '../components/game/GameSession'
import { useGame } from '../context/GameContext'
import { parseRulesVariant } from '../lib/rulesVariant'

export function PlayLocal() {
  const [params] = useSearchParams()
  const { setMode, resetGame, setRulesVariant } = useGame()
  const rules = parseRulesVariant(params.get('rules'))

  useEffect(() => {
    setMode('local')
    setRulesVariant(rules)
    resetGame()
  }, [setMode, resetGame, setRulesVariant, rules])

  return <GameSession initialRulesVariant={rules} />
}
