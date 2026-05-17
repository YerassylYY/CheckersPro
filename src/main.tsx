import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { GamificationProvider } from './context/GamificationContext'
import { StoreProvider } from './context/StoreContext'
import { GameProvider } from './context/GameContext'
import { Game4PProvider } from './context/Game4PContext'
import { MultiplayerProvider } from './context/MultiplayerContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <PreferencesProvider>
        <GamificationProvider>
          <StoreProvider>
            <GameProvider>
              <MultiplayerProvider>
                <Game4PProvider>
                  <App />
                </Game4PProvider>
              </MultiplayerProvider>
            </GameProvider>
          </StoreProvider>
        </GamificationProvider>
      </PreferencesProvider>
    </AuthProvider>
  </StrictMode>,
)
