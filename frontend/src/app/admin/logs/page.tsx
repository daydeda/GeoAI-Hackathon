'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface LogRow { id: string; action: string; entityType: string; entityId: string; oldValue?: string; newValue?: string; createdAt: string; actor?: { email: string; fullName: string } }

function LogsContent() {
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/audit-logs?limit=500`, { credentials: 'include' })
      if (res.ok) {
        const d = await res.json()
        setLogs(d.data || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-base)] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
        <div>
          <div className="font-mono text-[8px] sm:text-xs text-[var(--accent-green)] mb-1 sm:mb-2 tracking-widest">
            <span className="mr-1 sm:mr-2">■</span>{loading ? 'SYNCHRONIZING...' : 'SECURITY SYSTEM'}
          </div>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl text-white font-bold">Audit Logs</h1>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] rounded border border-[var(--border-subtle)] flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.05)]">
                <th className="py-3 sm:py-4 px-2 sm:px-3 text-left text-[8px] sm:text-xs text-[var(--text-muted)] font-semibold tracking-widest whitespace-nowrap">TIMESTAMP</th>
                <th className="py-3 sm:py-4 px-2 sm:px-3 text-left text-[8px] sm:text-xs text-[var(--text-muted)] font-semibold tracking-widest whitespace-nowrap hidden sm:table-cell">ACTOR</th>
                <th className="py-3 sm:py-4 px-2 sm:px-3 text-left text-[8px] sm:text-xs text-[var(--text-muted)] font-semibold tracking-widest whitespace-nowrap">ACTION</th>
                <th className="py-3 sm:py-4 px-2 sm:px-3 text-right text-[8px] sm:text-xs text-[var(--text-muted)] font-semibold tracking-widest whitespace-nowrap hidden md:table-cell">ENTITY</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.01)] transition">
                  <td className="py-3 sm:py-4 px-2 sm:px-3 min-w-max">
                    <div className="font-semibold text-xs sm:text-sm text-white">{new Date(log.createdAt).toLocaleDateString()}</div>
                    <div className="font-mono text-[8px] sm:text-xs text-[var(--text-muted)]">{new Date(log.createdAt).toLocaleTimeString()} UTC</div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-3 min-w-max hidden sm:table-cell">
                    <div className="text-xs sm:text-sm text-[var(--accent-cyan)] truncate">{log.actor?.email ?? 'SYSTEM'}</div>
                    <div className="text-[8px] sm:text-xs text-[var(--text-secondary)] truncate">{log.actor?.fullName ?? '-'}</div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-3 max-w-xs sm:max-w-sm lg:max-w-lg text-xs sm:text-sm text-white leading-relaxed">
                    {log.action.includes('Warning') ? (
                      <>{log.action.split('Submission Server')[0]} <span className="text-[var(--accent-amber)]">Submission Server{log.action.split('Submission Server')[1]}</span></>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: log.action.replace(/(Orbital Pioneers|Finalist|sarah\.connor|GitHub API|Judge)/g, '<span class="text-[var(--accent-green)]">$1</span>') }} />
                    )}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-3 text-right hidden md:table-cell min-w-max">
                    <div className="font-mono text-[8px] sm:text-xs text-[var(--text-muted)]">{log.entityType.toUpperCase()}</div>
                    <div className="font-mono text-[8px] sm:text-xs text-[var(--text-secondary)] truncate">{log.entityId}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function LogsPage() {
  return (
    <AuthProvider>
      <AppShell>
        <LogsContent />
      </AppShell>
    </AuthProvider>
  )
}
