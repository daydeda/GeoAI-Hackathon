import type { Metadata } from 'next'
import './globals.css'
import { AlertProvider } from '@/contexts/AlertContext'

export const metadata: Metadata = {
  title: 'GEOAI Hackathon — AGRI-DISASTER AI',
  description: 'Harnessing hyperscaled AI data and orbital intelligence to build resilient agricultural ecosystems and rapid disaster response protocols.',
  keywords: ['GEOAI', 'hackathon', 'agriculture', 'disaster response', 'AI', 'GISTDA'],
  openGraph: {
    title: 'GEOAI Hackathon — AGRI-DISASTER AI',
    description: 'Competition platform for the AGRI-DISASTER AI Hackathon',
    type: 'website',
  },
  viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[var(--bg-base)] text-[var(--text-primary)]">
        <AlertProvider>
          {children}
        </AlertProvider>
      </body>
    </html>
  )
}
