import type { RulesVariant } from '../../game/types'

const VARIANTS: {
  id: RulesVariant
  label: string
  hint: string
}[] = [
  { id: 'STANDARD', label: 'Standard', hint: 'Classic win by capture' },
  { id: 'GIVEAWAY', label: 'Giveaway', hint: 'Lose all pieces to win' },
  { id: 'ATOMIC', label: 'Atomic', hint: 'Captures detonate neighbors' },
]

interface RulesVariantPickerProps {
  value: RulesVariant
  onChange: (v: RulesVariant) => void
  disabled?: boolean
}

export function RulesVariantPicker({
  value,
  onChange,
  disabled,
}: RulesVariantPickerProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <p className="text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Rules variant
      </p>
      <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            disabled={disabled}
            title={v.hint}
            onClick={() => onChange(v.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              value === v.id
                ? v.id === 'ATOMIC'
                  ? 'bg-rose-950/60 text-rose-300'
                  : v.id === 'GIVEAWAY'
                    ? 'bg-violet-950/50 text-violet-300'
                    : 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            } disabled:opacity-50`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}
