import { useEffect } from 'react'
import { useStore } from '../context/StoreContext'

/** Applies active board skin CSS variables and data attributes to the document root. */
export function useSkinTheme() {
  const { activeSkin } = useStore()

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--board-light', activeSkin.boardLight)
    root.style.setProperty('--board-dark', activeSkin.boardDark)
    root.style.setProperty('--board-frame', activeSkin.boardFrame)
    root.style.setProperty('--board-glow', activeSkin.boardGlow)
    if (activeSkin.boardBg) {
      root.style.setProperty('--board-bg', activeSkin.boardBg)
    } else {
      root.style.removeProperty('--board-bg')
    }
    root.setAttribute('data-skin', activeSkin.id)
    root.setAttribute(
      'data-sound',
      activeSkin.soundPreset ?? 'default',
    )
    root.setAttribute('data-piece-white', activeSkin.pieceWhite)
    root.setAttribute('data-piece-black', activeSkin.pieceBlack)
  }, [activeSkin])
}
