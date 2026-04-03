import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GEOAI Hackathon — AGRI-DISASTER AI',
  description: 'Harnessing hyperscaled AI data and orbital intelligence to build resilient agricultural ecosystems and rapid disaster response protocols.',
  keywords: ['GEOAI', 'hackathon', 'agriculture', 'disaster response', 'AI', 'GISTDA'],
  openGraph: {
    title: 'GEOAI Hackathon — AGRI-DISASTER AI',
    description: 'Competition platform for the AGRI-DISASTER AI Hackathon',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
