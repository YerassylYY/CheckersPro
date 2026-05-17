import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold'
  children: ReactNode
}

const variants = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-700',
  secondary:
    'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600',
  ghost:
    'bg-transparent text-zinc-400 border border-transparent hover:bg-zinc-800 hover:text-zinc-200',
  gold:
    'bg-amber-600 text-white border border-amber-700 hover:bg-amber-500',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
