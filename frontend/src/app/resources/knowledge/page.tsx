'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import Link from 'next/link'

export default function ResourceKnowledgePage() {
  return (
    <AuthProvider>
      <AppShell>
        <div className="min-h-screen bg-(--bg-base) px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-6 sm:p-8">
            <h1 className="text-2xl font-semibold text-(--text-primary) sm:text-3xl">Knowledge Base</h1>
            <p className="mt-3 text-sm leading-relaxed text-(--text-secondary)">
              Competition knowledge and guidance are maintained on the docs page.
            </p>
            <Link
              href="/docs"
              className="mt-5 inline-flex items-center justify-center rounded border border-(--border-active) bg-[rgba(0,229,255,0.12)] px-4 py-2 text-sm font-medium text-(--accent-cyan) hover:bg-[rgba(0,229,255,0.18)]"
            >
              Open Docs
            </Link>
          </div>
        </div>
      </AppShell>
    </AuthProvider>
  )
}
