import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { AppShell } from './components/layout/AppShell'
import { Home } from './pages/Home'
import { PlayLocal } from './pages/PlayLocal'
import { PlayAI } from './pages/PlayAI'
import { PlayBlitz } from './pages/PlayBlitz'
import { Play4Player } from './pages/Play4Player'
import { PlayOnline } from './pages/PlayOnline'
import { OnlineRoom } from './pages/OnlineRoom'
import { FriendRoom } from './pages/FriendRoom'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { ShopPage } from './pages/ShopPage'
import { PuzzlesPage } from './pages/PuzzlesPage'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/play/local" element={<PlayLocal />} />
              <Route path="/play/blitz" element={<PlayBlitz />} />
              <Route path="/play/ai" element={<PlayAI />} />
              <Route path="/play/4player" element={<Play4Player />} />
              <Route path="/play/four" element={<Play4Player />} />
              <Route path="/play/online" element={<PlayOnline />} />
              <Route path="/play/online/:roomId" element={<OnlineRoom />} />
              <Route path="/room/:roomId" element={<FriendRoom />} />
              <Route path="/puzzles" element={<PuzzlesPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </main>
          <footer className="border-t py-4 text-center text-xs transition-colors border-[var(--app-border)] text-[var(--app-muted)]">
            BlitzCheckers Pro © 2026 — Investor-ready rapid checkers
          </footer>
        </div>
      </AppShell>
    </BrowserRouter>
  )
}
