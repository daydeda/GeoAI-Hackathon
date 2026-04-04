'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { useAlert } from '@/contexts/AlertContext'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Search,
  X,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface UserRow {
  id: string
  email: string
  fullName: string
  firstName?: string
  lastName?: string
  university?: string
  yearOfStudy?: number
  phoneNumber?: string
  address?: string
  profileCompleted?: boolean
  idCardUploaded?: boolean
  roles: string[]
}
interface TeamRow { id: string; name: string; institution: string; track: string; currentStatus: string; members: unknown[]; score?: number; submissions?: unknown[] }
interface LogRow { id: string; action: string; entityType: string; entityId: string; oldValue?: string; newValue?: string; createdAt: string; actor?: { email: string } }
interface TeamSubmissionRow { isActive?: boolean; scoreAggregate?: { totalWeighted?: number } }
interface TeamApiRow extends TeamRow { submissions?: TeamSubmissionRow[] }

import AppShell from '@/components/AppShell'

export default function AdminPage() {
  return (
    <AuthProvider>
      <AppShell>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
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
        const formattedTeams = (d as TeamApiRow[] || []).map((t) => {
          const activeSub = t.submissions?.find((s) => s.isActive);
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
  const exportCards: Array<{ label: string; title: string; type: string; icon: LucideIcon }> = [
    { label: 'TEAMS REGISTRY', title: 'Export Teams as CSV', type: 'TEAMS', icon: Download },
    { label: 'PROPOSAL BUNDLE', title: 'Export Proposals as XLSX', type: 'SUBMISSIONS', icon: FileSpreadsheet },
  ]

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-(--bg-base)">
      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[rgba(5,13,26,0.85)] p-4 backdrop-blur-sm">
           <div className="flex w-full max-w-md flex-col gap-6 rounded-lg border border-white/10 bg-(--bg-surface) p-6 shadow-[0_24px_64px_rgba(0,0,0,0.4)] sm:p-8">
              <div>
                 <h2 className="font-display mb-2 text-lg font-bold tracking-[0.05em] text-white sm:text-xl">
                   CONFIRM ACTION
                 </h2>
                 <p className="m-0 text-sm leading-relaxed text-(--text-secondary)">
                   Are you sure you want to <strong>{confirmAction.type}</strong> team <strong>{confirmAction.teamName}</strong>?
                 </p>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button 
                  onClick={() => setConfirmAction(null)}
                  className="rounded border border-(--border-subtle) bg-transparent px-6 py-2 text-xs font-semibold tracking-[0.05em] text-(--text-muted)"
                >
                  CANCEL
                </button>
                <button 
                  onClick={executeConfirmAction}
                  className="rounded border-none px-6 py-2 text-xs font-bold tracking-[0.05em] text-black"
                  style={{ background: confirmAction.type === 'PROMOTE' || confirmAction.type === 'RESTORE' ? 'var(--accent-cyan)' : 'var(--accent-red)' }}
                >
                  CONFIRM
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col gap-3">
        <div className="font-mono flex items-center gap-2 text-[11px] tracking-[0.1em] text-(--accent-green)">
          <Activity size={12} />
          <span>{loading ? 'SYNCHRONIZING...' : 'ADMINISTRATIVE TERMINAL'}</span>
        </div>
        <h1 className="font-display text-3xl text-white sm:text-4xl md:text-5xl">Command Center</h1>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'REGISTERED USERS', value: totalUsers.toLocaleString(), change: 'Platform Wide', changeColor: 'var(--accent-green)', color: 'var(--accent-cyan)' },
          { label: 'ACTIVE TEAMS', value: teams.length.toLocaleString(), change: 'Registered Squads', changeColor: 'var(--accent-green)', color: 'var(--accent-green)' },
          { label: 'TOTAL PROPOSALS', value: teams.reduce((acc, t) => acc + (t.submissions?.length || 0), 0).toLocaleString(), change: 'Submitted PDFs', changeColor: 'var(--text-muted)', color: 'var(--accent-amber)' },
          { label: 'CURRENT PHASE', value: 'Judging', change: 'Live Event', changeColor: 'var(--accent-cyan)', color: 'white' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col gap-3 border-l-2 bg-(--bg-surface) px-6 py-5" style={{ borderLeftColor: s.color }}>
            <div className="font-mono text-[11px] tracking-[0.1em] text-(--text-muted)">{s.label}</div>
            <div className="font-display text-3xl font-bold leading-none sm:text-4xl" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs font-medium" style={{ color: s.changeColor }}>{s.change}</div>
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main panels */}
        <div className="flex flex-col gap-6">
          {/* User Management */}
          <div className="border-t border-white/5 bg-(--bg-surface) p-4 sm:p-6 lg:p-8">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="mb-1 text-xl font-semibold text-white sm:text-2xl">User Management</h2>
                <div className="text-xs tracking-[0.05em] text-(--text-muted)">REGISTRY CONTROL & ROLE ASSIGNMENT</div>
              </div>
              <div className="relative w-full md:w-auto">
                <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-(--text-muted)" />
                <input
                  placeholder="SEARCH UUID / EMAIL"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 pl-9 text-xs tracking-[0.05em] text-white outline-none md:w-[260px]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">USER IDENTIFIER</th>
                  <th className="py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">USER INFORMATION</th>
                  <th className="py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">ROLE ASSIGNMENT</th>
                  <th className="py-4 text-right text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice(0, 10).map(u => (
                  <tr key={u.id} className="border-b border-white/[0.02]">
                    <td className="py-5">
                      <div className="mb-1 text-sm font-semibold text-white">{u.email}</div>
                      <div className="font-mono text-[10px] text-(--text-muted)">UUID: {u.id}</div>
                    </td>
                    <td className="py-5 text-sm text-(--text-secondary)">
                      <div>{u.fullName}</div>
                      <div className="text-[10px] text-(--text-muted)">
                        {u.firstName || '-'} {u.lastName || ''}
                      </div>
                      <div className="text-[10px] text-(--text-muted)">{u.university || 'University not set'}{u.yearOfStudy ? ` · Year ${u.yearOfStudy}` : ''}</div>
                      <div className="text-[10px] text-(--text-muted)">{u.phoneNumber || 'Phone not set'}</div>
                      <div className="text-[10px] text-(--text-muted)">{u.address || 'Address not set'}</div>
                      <div className="text-[10px] text-(--text-muted)">
                        Profile: {u.profileCompleted ? 'Completed' : 'Incomplete'} · ID: {u.idCardUploaded ? 'Uploaded' : 'Missing'}
                      </div>
                    </td>
                    <td className="py-5">
                      <div className="relative w-[150px]">
                        <select
                          className="w-full appearance-none rounded border border-white/10 bg-(--bg-base) px-3 py-2 text-xs text-white"
                          value={u.roles?.[0] ?? 'COMPETITOR'}
                          onChange={e => assignRole(u.id, e.target.value)}
                        >
                          {['COMPETITOR', 'MODERATOR', 'JUDGE', 'ADMIN'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="pointer-events-none absolute right-3 top-2.5 text-(--text-muted)" />
                      </div>
                    </td>
                    <td className="py-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: u.roles.includes('ADMIN') ? 'var(--accent-amber)' : 'var(--accent-green)' }} />
                        <span className="text-[11px] font-semibold tracking-[0.05em]" style={{ color: u.roles?.includes('ADMIN') ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                          {u.roles?.includes('ADMIN') ? 'RESTRICTED' : u.roles?.includes('COMPETITOR') ? 'ACTIVE' : 'VERIFIED'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Team Management */}
          <div className="border-t border-white/5 bg-(--bg-surface) p-4 sm:p-6 lg:p-8">
            <h2 className="mb-5 text-xl font-semibold text-white sm:text-2xl">Team Management</h2>
            <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">TEAM NAME</th>
                  <th className="py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">MEMBERS</th>
                  <th className="py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">SCORE (M)</th>
                  <th className="py-4 text-right text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">STATE PROMOTION</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => (
                  <tr key={i} className="border-b border-white/[0.02]">
                    <td className="py-5">
                      <div className="text-[15px] font-semibold text-(--accent-cyan)">{t.name}</div>
                    </td>
                    <td className="py-5 text-sm text-(--text-secondary)">{(t.members || []).length} Members</td>
                    <td className="py-5 text-sm text-white">{t.score?.toFixed(4) || 'N/A'}</td>
                    <td className="py-5 text-right">
                      {t.currentStatus === 'FINALIST' ? (
                        <div className="inline-flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 rounded border border-(--accent-green) bg-[rgba(0,230,118,0.1)] px-3 py-1.5 text-[11px] font-bold tracking-[0.05em] text-(--accent-green)">
                            <Check size={12} /> FINALIST
                          </span>
                          <button onClick={() => setConfirmAction({ type: 'REVOKE', teamId: t.id, teamName: t.name })} className="border-none bg-transparent text-[10px] text-(--text-muted) underline">REVOKE</button>
                        </div>
                      ) : t.currentStatus === 'REJECTED' ? (
                        <div className="inline-flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 rounded border border-(--accent-red) bg-[rgba(255,23,68,0.1)] px-3 py-1.5 text-[11px] font-bold tracking-[0.05em] text-(--accent-red)">
                            <X size={12} /> DISQUALIFIED
                          </span>
                          <button onClick={() => setConfirmAction({ type: 'RESTORE', teamId: t.id, teamName: t.name })} className="rounded border border-(--accent-cyan) bg-transparent px-3 py-1.5 text-[10px] text-(--accent-cyan)">RESTORE TO FINALIST</button>
                        </div>
                      ) : (
                        <div className="inline-flex gap-3">
                          <button 
                            onClick={() => setConfirmAction({ type: 'PROMOTE', teamId: t.id, teamName: t.name })}
                            className="border border-(--accent-cyan) bg-(--accent-cyan) px-4 py-2 text-[10px] font-semibold tracking-[0.05em] text-black"
                          >
                            PROMOTE
                          </button>
                          <button 
                            onClick={() => setConfirmAction({ type: 'DISQUALIFY', teamId: t.id, teamName: t.name })}
                            className="border border-[rgba(255,23,68,0.4)] bg-transparent px-4 py-2 text-[10px] font-semibold tracking-[0.05em] text-(--text-muted)"
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
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-6">
          {/* Data Extraction */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Data Extraction</h3>
            <div className="flex flex-col gap-3">
              {exportCards.map(exp => (
                <div 
                  key={exp.type} 
                  onClick={() => exportData(exp.type)}
                  className="flex cursor-pointer items-center justify-between border-l-2 border-transparent bg-(--bg-surface) px-5 py-4 transition hover:border-(--accent-cyan)"
                >
                  <div>
                    <div className="font-mono mb-1 text-[10px] tracking-[0.1em] text-(--text-muted)">{exp.label}</div>
                    <div className="text-sm font-medium text-white">{exp.title}</div>
                  </div>
                  <exp.icon size={18} className="text-(--accent-cyan)" />
                </div>
              ))}
            </div>
          </div>

          {/* Live Ops Log */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-[0.1em] text-(--text-secondary)">LIVE OPERATIONAL LOG</h3>
              <span className="h-2 w-2 rounded-full bg-(--accent-green) shadow-[0_0_10px_var(--accent-green)]" />
            </div>

            <div className="flex flex-col gap-3">
              {logs.slice(0, 4).map((log) => (
                <div key={log.id} className="bg-(--bg-surface) p-4">
                  <div className="mb-2 flex justify-between gap-3">
                    <span className="font-mono text-[10px] text-(--text-muted)">LOG_ID: {log.entityId}</span>
                    <span className="font-mono text-[10px] text-(--text-muted)">{new Date(log.createdAt).toISOString().split('T')[1].substring(0,8)} UTC</span>
                  </div>
                  <div className="text-xs leading-relaxed text-(--text-secondary)">
                    {log.action.includes('Warning') ? (
                      <>{log.action.split('Submission Server')[0]} <span style={{ color: 'var(--accent-amber)' }}>Submission Server{log.action.split('Submission Server')[1]}</span></>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: log.action.replace(/(Orbital Pioneers|Finalist|sarah\.connor|GitHub API|Judge)/g, '<span style="color:var(--accent-green)">$1</span>') }} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <Link href="/admin/logs" className="no-underline">
                <button className="w-full border border-white/10 bg-transparent py-3 text-[11px] tracking-[0.1em] text-(--text-muted)">
                  VIEW FULL AUDIT TRAIL
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-8 flex flex-col gap-3 border-t border-white/5 pt-6 text-[10px] tracking-[0.05em] text-(--text-muted) lg:flex-row lg:items-center lg:justify-between">
        <div>© 2024 GEOAI HACKATHON | PRECISION LENS UI</div>
        <div className="flex flex-wrap gap-4 lg:gap-6">
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

