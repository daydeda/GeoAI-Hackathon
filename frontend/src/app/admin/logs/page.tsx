'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'

const API = process.env.NEXT_PUBLIC_API_URL || '/geoai-2026'

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
    <div style={{ padding: '40px 60px', maxWidth: 1440, margin: '0 auto', background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent-green)', marginBottom: 8, letterSpacing: '0.1em' }}><span style={{ color: 'var(--accent-green)', marginRight: 6 }}>■</span>  {loading ? 'SYNCHRONIZING...' : 'SECURITY SYSTEM'}</div>
          <h1 className="font-display" style={{ fontSize: 44, color: 'white' }}>Audit Logs</h1>
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', padding: 32, borderTop: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '16px 0', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>TIMESTAMP</th>
              <th style={{ padding: '16px 0', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>ACTOR</th>
              <th style={{ padding: '16px 0', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>ACTION</th>
              <th style={{ padding: '16px 0', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>ENTITY (ID)</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '20px 0', width: 220 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'white' }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleTimeString()} UTC</div>
                </td>
                <td style={{ padding: '20px 0' }}>
                  <div style={{ fontSize: 13, color: 'var(--accent-cyan)' }}>{log.actor?.email ?? 'SYSTEM'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{log.actor?.fullName ?? '-'}</div>
                </td>
                <td style={{ padding: '20px 0', fontSize: 13, color: 'white', lineHeight: 1.5, maxWidth: 400 }}>
                    {log.action.includes('Warning') ? (
                      <>{log.action.split('Submission Server')[0]} <span style={{ color: 'var(--accent-amber)' }}>Submission Server{log.action.split('Submission Server')[1]}</span></>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: log.action.replace(/(Orbital Pioneers|Finalist|sarah\.connor|GitHub API|Judge)/g, '<span style="color:var(--accent-green)">$1</span>') }} />
                    )}
                </td>
                <td style={{ padding: '20px 0', textAlign: 'right' }}>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{log.entityType.toUpperCase()}</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{log.entityId}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
