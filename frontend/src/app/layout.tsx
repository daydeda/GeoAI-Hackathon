import type { Metadata, Viewport } from 'next'
import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'GEOAI Hackathon — AGRI-DISASTER AI',
  description: 'Harnessing hyperscaled AI data and orbital intelligence to build resilient agricultural ecosystems and rapid disaster response protocols.',
  keywords: ['GEOAI', 'hackathon', 'agriculture', 'disaster response', 'AI', 'GISTDA'],
  icons: {
    icon: '/geoAI-logo.svg',
    shortcut: '/geoAI-logo.svg',
    apple: '/geoAI-logo.svg',
  },
  openGraph: {
    title: 'GEOAI Hackathon — AGRI-DISASTER AI',
    description: 'Competition platform for the AGRI-DISASTER AI Hackathon',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-(--bg-base) text-(--text-primary)">
        {children}
      </body>
    </html>
  )
}
