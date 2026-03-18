import type { Metadata } from 'next'
import { Assistant } from 'next/font/google'
import { RenovationProvider } from '@/components/renovation/RenovationContext'
import { RenovationShell } from '@/components/renovation/RenovationShell'

const assistant = Assistant({
  subsets: ['latin', 'hebrew'],
  display: 'swap',
  variable: '--font-assistant',
})

export const metadata: Metadata = {
  title: 'Renovation — CasaTrack',
  description: 'Track renovation budget, tasks, and photos',
}

export default function RenovationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${assistant.variable} font-assistant`}>
      <RenovationProvider>
        <RenovationShell>{children}</RenovationShell>
      </RenovationProvider>
    </div>
  )
}
