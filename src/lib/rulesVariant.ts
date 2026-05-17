import type { RulesVariant } from '../game/types'

export const RULES_VARIANT_LABELS: Record<RulesVariant, string> = {
  STANDARD: 'Standard',
  GIVEAWAY: 'Giveaway (Поддавки)',
  ATOMIC: 'Atomic (Атомные)',
}

export function parseRulesVariant(value: string | null): RulesVariant {
  if (value === 'GIVEAWAY' || value === 'ATOMIC' || value === 'STANDARD') {
    return value
  }
  return 'STANDARD'
}
