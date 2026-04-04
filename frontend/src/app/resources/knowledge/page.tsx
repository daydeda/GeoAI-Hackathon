'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { DocsContent } from '@/app/docs/page'

export default function ResourceKnowledgePage() {
  return (
    <AuthProvider>
      <AppShell>
        <DocsContent enhancedRewards />
      </AppShell>
    </AuthProvider>
  )
}
