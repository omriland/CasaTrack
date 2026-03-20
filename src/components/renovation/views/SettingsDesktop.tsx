'use client'

import { SettingsBody } from './SettingsBody'
import { useRenovationSettingsPageState } from './useRenovationSettingsPageState'

export function SettingsDesktop() {
  const ctx = useRenovationSettingsPageState()
  return <SettingsBody ctx={ctx} mobile={false} />
}
