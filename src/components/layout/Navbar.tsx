import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Home,
  Swords,
  Trophy,
  User,
  ShoppingBag,
  Sun,
  Moon,
  Baby,
  Vibrate,
  Brain,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import { ProBanner } from '../store/ProBanner'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
    isActive
      ? 'bg-zinc-800 text-white dark:bg-zinc-800'
      : 'text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200'
  }`

function Toggle({
  on,
  onChange,
  label,
  icon,
}: {
  on: boolean
  onChange: () => void
  label: string
  icon: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      title={label}
      aria-pressed={on}
      className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
        on
          ? 'border-emerald-700 bg-emerald-950/50 text-emerald-400'
          : 'border-zinc-300 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500'
      }`}
    >
      {icon}
    </button>
  )
}

export function Navbar() {
  const { user, logout } = useAuth()
  const {
    theme,
    toggleTheme,
    kidsMode,
    setKidsMode,
    accessibilityFeedback,
    setAccessibilityFeedback,
  } = usePreferences()

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--app-border)] bg-[var(--app-surface)] transition-colors">
      <ProBanner compact />
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">
            BC
          </span>
          <span className="text-base font-semibold text-[var(--app-text)]">
            BlitzCheckers Pro
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            <Home size={16} /> Home
          </NavLink>
          <NavLink to="/play/blitz" className={navLinkClass}>
            <Swords size={16} /> Blitz
          </NavLink>
          <NavLink to="/puzzles" className={navLinkClass}>
            <Brain size={16} /> Puzzles
          </NavLink>
          <NavLink to="/leaderboard" className={navLinkClass}>
            <Trophy size={16} /> Leaderboard
          </NavLink>
          <NavLink to="/shop" className={navLinkClass}>
            <ShoppingBag size={16} /> Shop
          </NavLink>
          <NavLink to={user ? '/dashboard' : '/auth'} className={navLinkClass}>
            <User size={16} /> {user ? 'Dashboard' : 'Login'}
          </NavLink>
        </div>

        <div className="flex items-center gap-1.5">
          <Toggle
            on={theme === 'light'}
            onChange={toggleTheme}
            label="Toggle light/dark theme"
            icon={
              theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />
            }
          />
          <Toggle
            on={kidsMode}
            onChange={() => setKidsMode(!kidsMode)}
            label="Checkers for Kids"
            icon={<Baby size={16} />}
          />
          <Toggle
            on={accessibilityFeedback}
            onChange={() => setAccessibilityFeedback(!accessibilityFeedback)}
            label="Accessibility haptic & visual feedback"
            icon={<Vibrate size={16} />}
          />
          {user && (
            <span className="hidden text-xs tabular-nums text-amber-500 sm:inline">
              {user.points} coins
            </span>
          )}
          {user && (
            <button
              type="button"
              onClick={logout}
              className="text-xs font-medium text-zinc-500 transition-colors hover:text-rose-400"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
