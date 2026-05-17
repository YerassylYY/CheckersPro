import type { ReactNode } from 'react'
import { useSkinTheme } from '../../hooks/useSkinTheme'
import { ScreenFlash } from './ScreenFlash'
import { ProSubscriptionModal } from '../store/ProSubscriptionModal'
import { StripeModal } from '../store/StripeModal'

export function AppShell({ children }: { children: ReactNode }) {
  useSkinTheme()
  return (
    <>
      <ScreenFlash />
      {children}
      <ProSubscriptionModal />
      <StripeModal />
    </>
  )
}
