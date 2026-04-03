'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { useAlert } from '@/contexts/AlertContext'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || '/geoai-2026'

interface UserRow { id: string; email: string; fullName: string; roles: string[] }
interface TeamRow { id: string; name: string; institution: string; track: string; currentStatus: string; members: unknown[]; score?: number; submissions?: unknown[] }
interface LogRow { id: string; action: string; entityType: string; entityId: string; oldValue?: string; newValue?: string; createdAt: string; actor?: { email: string } }

import AppShell from '@/components/AppShell'

export default function AdminPage() {
  return (
    <AuthProvider>
      <AppShell>
        <div style={{ padding: '32px 48px' }}>
          <AdminContent />
        </div>
      </AppShell>
    </AuthProvider>
  )
}

function AdminContent() {
  const { showAlert } = useAlert()
  const [users, setUsers] = useState<UserRow[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [logs, setLogs] = useState<LogRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<{ type: 'PROMOTE' | 'DISQUALIFY' | 'REVOKE' | 'RESTORE', teamId: string, teamName: string } | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const opts = { credentials: 'include', signal: controller.signal } as const
      const [usersRes, teamsRes, logsRes] = await Promise.all([
        fetch(`${API}/api/v1/admin/users`, opts),
        fetch(`${API}/api/v1/admin/teams`, opts),
        fetch(`${API}/api/v1/admin/audit-logs?limit=10`, opts),
      ])
      
      clearTimeout(timeoutId)
      
      if (usersRes.ok) { const d = await usersRes.json(); setUsers(d.data || []); setTotalUsers(d.total || 0); }
      if (teamsRes.ok) { 
        const d = await teamsRes.json(); 
        const formattedTeams = (d || []).map((t: any) => {
          const activeSub = t.submissions?.find((s: any) => s.isActive);
          return { ...t, score: activeSub?.scoreAggregate?.totalWeighted ?? undefined };
        });
        setTeams(formattedTeams); 
      }
      if (logsRes.ok) { const d = await logsRes.json(); setLogs(d.data || []); }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.warn('Admin fetch timed out')
      } else {
        console.error('Failed to fetch admin data:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      await fetchAll();
    };
    load();
    return () => { active = false; };
  }, [fetchAll])

  const assignRole = async (userId: string, role: string) => {
    try {
      await fetch(`${API}/api/v1/admin/users/${userId}/roles`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
      fetchAll()
    } catch { }
  }

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, teamId } = confirmAction;
    setConfirmAction(null);
    try {
      const status = (type === 'PROMOTE' || type === 'RESTORE') ? 'FINALIST' : 'REJECTED';
      await fetch(`${API}/api/v1/admin/teams/${teamId}/status`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      fetchAll()
    } catch { }
  }

  const exportData = async (type: string) => {
    try {
      const res = await fetch(`${API}/api/v1/admin/exports`, { 
        method: 'POST', 
        credentials: 'include', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ type }) 
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Export failed:', errorData);
        showAlert(`Export failed: ${errorData.message || 'Unknown error'}`, 'error');
        return;
      }

      const disposition = res.headers.get('Content-Disposition')
      let filename = `${type.toLowerCase() === 'teams' ? 'teams.csv' : 'submissions.xlsx'}`
      
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        const matches = filenameRegex.exec(disposition)
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '')
        }
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export exception:', err)
      showAlert('An unexpected error occurred during export.', 'error')
    }
  }

  const filteredUsers = users.filter(u => !search || u.email.includes(search) || u.fullName.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ padding: '40px 60px', maxWidth: 1440, margin: '0 auto', background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Confirmation Modal */}
      {confirmAction && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(5, 13, 26, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', transition: 'all 0.3s ease'
        }}>
           <div style={{ 
             background: 'var(--bg-surface)', border: `1px solid rgba(255, 255, 255, 0.1)`, padding: '32px 40px', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: `0 24px 64px rgba(0,0,0,0.4)`, animation: 'appear 0.3s cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: 400
           }}>
              <div>
                 <h2 className="font-display" style={{ fontSize: 20, color: 'white', marginBottom: 8, fontWeight: 700, letterSpacing: '0.05em' }}>
                   CONFIRM ACTION
                 </h2>
                 <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                   Are you sure you want to <strong>{confirmAction.type}</strong> team <strong>{confirmAction.teamName}</strong>?
                 </p>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button 
                  onClick={() => setConfirmAction(null)}
                  style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '8px 24px', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer', borderRadius: 2 }}
                >
                  CANCEL
                </button>
                <button 
                  onClick={executeConfirmAction}
                  style={{ background: confirmAction.type === 'PROMOTE' || confirmAction.type === 'RESTORE' ? 'var(--accent-cyan)' : 'var(--accent-red)', color: 'black', border: 'none', padding: '8px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', cursor: 'pointer', borderRadius: 2 }}
                >
                  CONFIRM
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent-green)', marginBottom: 8, letterSpacing: '0.1em' }}><span style={{ color: 'var(--accent-green)', marginRight: 6 }}>■</span>  {loading ? 'SYNCHRONIZING...' : 'ADMINISTRATIVE TERMINAL'}</div>
          <h1 className="font-display" style={{ fontSize: 44, color: 'white' }}>Command Center</h1>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
        {[
          { label: 'REGISTERED USERS', value: totalUsers.toLocaleString(), change: 'Platform Wide', changeColor: 'var(--accent-green)', color: 'var(--accent-cyan)' },
          { label: 'ACTIVE TEAMS', value: teams.length.toLocaleString(), change: 'Registered Squads', changeColor: 'var(--accent-green)', color: 'var(--accent-green)' },
          { label: 'TOTAL PROPOSALS', value: teams.reduce((acc, t) => acc + (t.submissions?.length || 0), 0).toLocaleString(), change: 'Submitted PDFs', changeColor: 'var(--text-muted)', color: 'var(--accent-amber)' },
          { label: 'CURRENT PHASE', value: 'Judging', change: 'Live Event', changeColor: 'var(--accent-cyan)', isText: true, color: 'white' },
        ].map((s, i) => (
          <div key={i} style={{ 
            background: 'var(--bg-surface)', borderLeft: `2px solid ${s.color}`, padding: '24px 30px', 
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
            <div className="font-display" style={{ fontSize: 42, color: s.color, lineHeight: 1, fontWeight: 700 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: s.changeColor, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>{s.change}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, flex: 1 }}>
        {/* Main panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* User Management */}
          <div style={{ background: 'var(--bg-surface)', padding: 32, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: 'white', marginBottom: 4 }}>User Management</h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>REGISTRY CONTROL & ROLE ASSIGNMENT</div>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)', fontSize: 14 }}>⚲</span>
                <input
                  placeholder="SEARCH UUID / EMAIL"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 2, padding: '8px 12px 8px 36px', fontSize: 11, width: 260, color: 'white', outline: 'none', letterSpacing: '0.05em' }}
                />
              </div>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px 0', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>USER IDENTIFIER</th>
                  <th style={{ padding: '16px 0', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>AFFILIATION</th>
                  <th style={{ padding: '16px 0', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>ROLE ASSIGNMENT</th>
                  <th style={{ padding: '16px 0', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice(0, 10).map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '20px 0' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'white', marginBottom: 4 }}>{u.email}</div>
                      <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>UUID: {u.id}</div>
                    </td>
                    <td style={{ padding: '20px 0', fontSize: 13, color: 'var(--text-secondary)' }}>{u.fullName}</td>
                    <td style={{ padding: '20px 0' }}>
                      <div style={{ position: 'relative', width: 140 }}>
                        <select
                          style={{ appearance: 'none', width: '100%', background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', fontSize: 12, borderRadius: 2, cursor: 'pointer' }}
                          value={u.roles?.[0] ?? 'COMPETITOR'}
                          onChange={e => assignRole(u.id, e.target.value)}
                        >
                          {['COMPETITOR', 'MODERATOR', 'JUDGE', 'ADMIN'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <span style={{ position: 'absolute', right: 12, top: 10, color: 'var(--text-muted)', pointerEvents: 'none', fontSize: 10 }}>▼</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 0', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.roles.includes('ADMIN') ? 'var(--accent-amber)' : 'var(--accent-green)' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: u.roles?.includes('ADMIN') ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                          {u.roles?.includes('ADMIN') ? 'RESTRICTED' : u.roles?.includes('COMPETITOR') ? 'ACTIVE' : 'VERIFIED'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Team Management */}
          <div style={{ background: 'var(--bg-surface)', padding: 32, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: 'white', marginBottom: 24 }}>Team Management</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px 0', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>TEAM NAME</th>
                  <th style={{ padding: '16px 0', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>MEMBERS</th>
                  <th style={{ padding: '16px 0', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>SCORE (M)</th>
                  <th style={{ padding: '16px 0', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>STATE PROMOTION</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '20px 0' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: 15 }}>{t.name}</div>
                    </td>
                    <td style={{ padding: '20px 0', fontSize: 13, color: 'var(--text-secondary)' }}>{(t.members || []).length} Members</td>
                    <td style={{ padding: '20px 0', fontSize: 13, color: 'white' }}>{t.score?.toFixed(4) || 'N/A'}</td>
                    <td style={{ padding: '20px 0', textAlign: 'right' }}>
                      {t.currentStatus === 'FINALIST' ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ color: 'var(--accent-green)', padding: '6px 12px', background: 'rgba(0,230,118,0.1)', border: '1px solid var(--accent-green)', borderRadius: 2, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>✓ FINALIST</span>
                          <button onClick={() => setConfirmAction({ type: 'REVOKE', teamId: t.id, teamName: t.name })} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', textDecoration: 'underline' }}>REVOKE</button>
                        </div>
                      ) : t.currentStatus === 'REJECTED' ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ color: 'var(--accent-red)', padding: '6px 12px', background: 'rgba(255,23,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: 2, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>⨯ DISQUALIFIED</span>
                          <button onClick={() => setConfirmAction({ type: 'RESTORE', teamId: t.id, teamName: t.name })} style={{ background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '6px 12px', fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>RESTORE TO FINALIST</button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: 12 }}>
                          <button 
                            onClick={() => setConfirmAction({ type: 'PROMOTE', teamId: t.id, teamName: t.name })}
                            style={{ background: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', color: 'black', padding: '8px 16px', fontSize: 10, letterSpacing: '0.05em', fontWeight: 600, cursor: 'pointer' }}
                          >
                            PROMOTE
                          </button>
                          <button 
                            onClick={() => setConfirmAction({ type: 'DISQUALIFY', teamId: t.id, teamName: t.name })}
                            style={{ background: 'transparent', border: '1px solid rgba(255, 23, 68, 0.4)', color: 'var(--text-muted)', padding: '8px 16px', fontSize: 10, letterSpacing: '0.05em', fontWeight: 600, cursor: 'pointer' }}
                          >
                            DISQUALIFY
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Data Extraction */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 20 }}>Data Extraction</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'TEAMS REGISTRY', title: 'Export Teams as CSV', type: 'TEAMS', icon: '⬇' },
                { label: 'PROPOSAL BUNDLE', title: 'Export Proposals as XLSX', type: 'SUBMISSIONS', icon: '☁' },
              ].map(exp => (
                <div 
                  key={exp.type} 
                  onClick={() => exportData(exp.type)}
                  style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderLeft: '3px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.1em' }}>{exp.label}</div>
                    <div style={{ fontSize: 14, color: 'white', fontWeight: 500 }}>{exp.title}</div>
                  </div>
                  <span style={{ color: 'var(--accent-cyan)', fontSize: 20 }}>{exp.icon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Ops Log */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 12, letterSpacing: '0.1em', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>LIVE OPERATIONAL LOG</h3>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {logs.slice(0, 4).map((log) => (
                <div key={log.id} style={{ background: 'var(--bg-surface)', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>LOG_ID: {log.entityId}</span>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(log.createdAt).toISOString().split('T')[1].substring(0,8)} UTC</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {log.action.includes('Warning') ? (
                      <>{log.action.split('Submission Server')[0]} <span style={{ color: 'var(--accent-amber)' }}>Submission Server{log.action.split('Submission Server')[1]}</span></>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: log.action.replace(/(Orbital Pioneers|Finalist|sarah\.connor|GitHub API|Judge)/g, '<span style="color:var(--accent-green)">$1</span>') }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href="/admin/logs" style={{ textDecoration: 'none' }}>
                <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '12px 0', width: '100%', fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer' }}>
                  VIEW FULL AUDIT TRAIL
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
        <div>© 2024 GEOAI HACKATHON | PRECISION LENS UI</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <span>KMITL</span>
          <span>ESRI</span>
          <span>GISTDA</span>
          <span>PRIVACY POLICY</span>
          <span>TERMS OF SERVICE</span>
        </div>
      </footer>
    </div>
  )
}

