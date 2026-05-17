import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'md' | 'lg' | 'xl' | '2xl'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null

  const sizes = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative w-full ${sizes[size]} rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
