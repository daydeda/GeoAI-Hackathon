'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useAlert } from '@/contexts/AlertContext'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowUpDown,
  Check,
  Download,
  FileSpreadsheet,
  Mail,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { formatPhaseDeadline } from '@/lib/phaseDeadline'
import { formatAuditLogTimestamp } from '@/lib/auditLogTime'
import CustomDropdown from '@/components/CustomDropdown'
import { useCompetitionPhases } from '@/hooks/useCompetitionPhases'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Role priority order (higher index = higher privilege)
const ROLE_PRIORITY: Record<string, number> = {
  COMPETITOR: 0,
  MODERATOR: 1,
  JUDGE: 2,
  ADMIN: 3,
}

/** Returns the single "primary" role for a user (highest privilege wins) */
function getPrimaryRole(roles: string[]): string {
  if (!roles || roles.length === 0) return 'COMPETITOR'
  return [...roles].sort(
    (a, b) => (ROLE_PRIORITY[b] ?? -1) - (ROLE_PRIORITY[a] ?? -1),
  )[0]
}

interface UserRow {
  id: string
  email: string
  fullName: string
  createdAt?: string
  avatarUrl?: string | null
  firstName?: string
  lastName?: string
  university?: string
  yearOfStudy?: number
  phoneNumber?: string
  address?: string
  profileCompleted?: boolean
  idCardUploaded?: boolean
  roles: string[]
  competitorStatus?: string | null
  moderatorNote?: string | null
}
interface TeamMemberRow {
  id: string
  user: {
    id: string
    email: string
    fullName: string
    avatarUrl?: string | null
    idCardUploaded?: boolean
  }
}

interface TeamRow {
  id: string
  name: string
  institution: string
  track: string
  currentStatus: string
  members: TeamMemberRow[]
  score?: number
  submissions?: unknown[]
}
interface LogRow {
  id: string
  action: string
  entityType: string
  entityId: string
  oldValue?: string
  newValue?: string
  createdAt: string
  actor?: { email: string }
}
interface TeamSubmissionRow {
  isActive?: boolean
  scoreAggregate?: { totalWeighted?: number }
}
interface TeamApiRow extends TeamRow {
  submissions?: TeamSubmissionRow[]
}
interface AnnouncementEmailStatus {
  announcementDate: string
  enabled: boolean
  sentCount: number
  failedCount: number
}

type SortField = 'role' | 'email' | 'name' | null
type SortDir = 'asc' | 'desc'

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
  const { hasRole, loading: authLoading } = useAuth()
  const { showAlert } = useAlert()
  const [users, setUsers] = useState<UserRow[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [userLimit] = useState(20)
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [totalTeams, setTotalTeams] = useState(0)
  const [teamPage, setTeamPage] = useState(1)
  const [teamLimit] = useState(10)
  const [logs, setLogs] = useState<LogRow[]>([])
  const [search, setSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  const [userStatusFilter, setUserStatusFilter] = useState('ALL')
  const [teamTrackFilter, setTeamTrackFilter] = useState('ALL')
  const [teamSearch, setTeamSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false)
  const [announcementStatus, setAnnouncementStatus] =
    useState<AnnouncementEmailStatus | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'PROMOTE' | 'DISQUALIFY' | 'REVOKE' | 'RESTORE'
    teamId: string
    teamName: string
  } | null>(null)

  // ── Client-side sort state for the users table ──────────────────────────
  const [sortField, setSortField] = useState<SortField>('role')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  // ────────────────────────────────────────────────────────────────────────

  const { currentPhase, phases } = useCompetitionPhases()
  const phaseDeadline = formatPhaseDeadline(currentPhase.date)
  const announcementPhase = phases.find((phase) => phase.key === 'announcement')
  const announcementDeadlineText = announcementPhase
    ? formatPhaseDeadline(announcementPhase.date)
    : '-'
  const canAccessManagementTools = hasRole('ADMIN') || hasRole('MODERATOR')

  useEffect(() => {
    // management-links fetch removed
  }, [authLoading, canAccessManagementTools])

  const totalUserPages = Math.max(1, Math.ceil(totalUsers / userLimit))
  const userFrom = totalUsers === 0 ? 0 : (userPage - 1) * userLimit + 1
  const userTo = Math.min(userPage * userLimit, totalUsers)
  const totalTeamPages = Math.max(1, Math.ceil(totalTeams / teamLimit))
  const teamFrom = totalTeams === 0 ? 0 : (teamPage - 1) * teamLimit + 1
  const teamTo = Math.min(teamPage * teamLimit, totalTeams)

  const openUserUpload = (userId: string, type: 'avatar' | 'id-card') => {
    window.open(
      `${API}/api/v1/admin/users/${userId}/uploads/${type}/view`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const opts = {
        credentials: 'include',
        signal: controller.signal,
      } as const
      const userParams = new URLSearchParams({
        page: String(userPage),
        limit: String(userLimit),
      })
      const trimmedSearch = search.trim()
      if (trimmedSearch) userParams.set('search', trimmedSearch)
      if (userRoleFilter !== 'ALL') userParams.set('role', userRoleFilter)
      if (userStatusFilter !== 'ALL') userParams.set('competitorStatus', userStatusFilter)
      const teamParams = new URLSearchParams({
        page: String(teamPage),
        limit: String(teamLimit),
      })
      if (teamTrackFilter !== 'ALL') teamParams.set('track', teamTrackFilter)
      const trimmedTeamSearch = teamSearch.trim()
      if (trimmedTeamSearch) teamParams.set('search', trimmedTeamSearch)

      const [usersRes, teamsRes, logsRes, announcementRes] = await Promise.all([
        fetch(`${API}/api/v1/admin/users?${userParams.toString()}`, opts),
        fetch(`${API}/api/v1/admin/teams?${teamParams.toString()}`, opts),
        fetch(`${API}/api/v1/admin/audit-logs?limit=10`, opts),
        fetch(`${API}/api/v1/admin/announcement-email/status`, opts),
      ])

      clearTimeout(timeoutId)

      if (usersRes.ok) {
        const d = await usersRes.json()
        setUsers(d.data || [])
        setTotalUsers(d.total || 0)
      }
      if (teamsRes.ok) {
        const d = await teamsRes.json()
        const formattedTeams = ((d.data as TeamApiRow[]) || []).map((t) => {
          const activeSub = t.submissions?.find((s) => s.isActive)
          return {
            ...t,
            score: activeSub?.scoreAggregate?.totalWeighted ?? undefined,
          }
        })
        setTeams(formattedTeams)
        setTotalTeams(d.total || 0)
      }
      if (logsRes.ok) {
        const d = await logsRes.json()
        setLogs(d.data || [])
      }
      if (announcementRes.ok) {
        const d = await announcementRes.json()
        setAnnouncementStatus(d)
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.warn('Admin fetch timed out')
      } else {
        console.error('Failed to fetch admin data:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [
    search,
    userRoleFilter,
    userStatusFilter,
    userLimit,
    userPage,
    teamTrackFilter,
    teamSearch,
    teamLimit,
    teamPage,
  ])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!active) return
      await fetchAll()
    }
    load()
    return () => {
      active = false
    }
  }, [fetchAll])

  // ── Role assignment: PUT replaces all roles with exactly one role ────────
  const assignRole = async (userId: string, newRole: string) => {
    try {
      // PUT /roles replaces the entire roles array; if backend only has POST,
      // we first DELETE all existing roles then POST the new one.
      const res = await fetch(`${API}/api/v1/admin/users/${userId}/roles`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        // Fallback: try POST (old API) — server should handle idempotency
        await fetch(`${API}/api/v1/admin/users/${userId}/roles`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        })
      }

      // Optimistically update local state so the UI reflects the change
      // immediately without waiting for a full refetch.
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, roles: [newRole] } : u)),
      )

      // Then do a background refetch to sync server state
      fetchAll()
    } catch (err) {
      console.error('assignRole failed:', err)
      showAlert('Failed to update role.', 'error')
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const deleteUser = async (userId: string, userEmail: string) => {
    if (
      !window.confirm(
        `Delete user ${userEmail}? This action cannot be undone.`,
      )
    )
      return
    try {
      const res = await fetch(`${API}/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showAlert(data.error || 'Failed to delete user', 'error')
        return
      }
      showAlert('User deleted successfully', 'info')
      fetchAll()
    } catch {
      showAlert('Failed to delete user', 'error')
    }
  }

  const deleteTeam = async (teamId: string, teamName: string) => {
    if (
      !window.confirm(
        `Delete team ${teamName}? This action cannot be undone.`,
      )
    )
      return
    try {
      const res = await fetch(`${API}/api/v1/admin/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showAlert(data.error || 'Failed to delete team', 'error')
        return
      }
      showAlert('Team deleted successfully', 'info')
      fetchAll()
    } catch {
      showAlert('Failed to delete team', 'error')
    }
  }

  const executeConfirmAction = async () => {
    if (!confirmAction) return
    const { type, teamId } = confirmAction
    setConfirmAction(null)
    try {
      const status =
        type === 'PROMOTE' || type === 'RESTORE' ? 'FINALIST' : 'REJECTED'
      await fetch(`${API}/api/v1/admin/teams/${teamId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchAll()
    } catch {}
  }

  const exportData = async (type: string) => {
    try {
      const res = await fetch(`${API}/api/v1/admin/exports`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        showAlert(
          `Export failed: ${errorData.message || 'Unknown error'}`,
          'error',
        )
        return
      }

      const disposition = res.headers.get('Content-Disposition')
      let filename = 'export.xlsx'
      if (type.toLowerCase() === 'teams') filename = 'teams.csv'
      if (type.toLowerCase() === 'submissions') filename = 'submissions.xlsx'
      if (type.toLowerCase() === 'users') filename = 'competitors.xlsx'

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

  const exportCards: Array<{
    label: string
    title: string
    type: string
    icon: LucideIcon
  }> = [
    {
      label: 'COMPETITOR REGISTRY',
      title: 'Export Competitors as XLSX',
      type: 'USERS',
      icon: Download,
    },
    {
      label: 'TEAMS REGISTRY',
      title: 'Export Teams as CSV',
      type: 'TEAMS',
      icon: Download,
    },
    {
      label: 'PROPOSAL BUNDLE',
      title: 'Export Proposals as XLSX',
      type: 'SUBMISSIONS',
      icon: FileSpreadsheet,
    },
  ]

  const sendAnnouncementEmails = async () => {
    if (!announcementStatus?.enabled || sendingAnnouncement) return
    if (
      !window.confirm(
        'Send announcement emails now? This will send to all eligible competitor accounts who have not been sent yet.',
      )
    )
      return

    setSendingAnnouncement(true)
    try {
      const res = await fetch(
        `${API}/api/v1/admin/announcement-email/send`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onlyGmail: false }),
        },
      )

      const payload = (await res.json().catch(() => ({}))) as {
        error?: string
        sentCount?: number
        failedCount?: number
        skippedCount?: number
      }

      if (!res.ok) {
        showAlert(
          payload.error || 'Failed to send announcement emails.',
          'error',
        )
        return
      }

      showAlert(
        `Announcement emails completed. Sent: ${payload.sentCount ?? 0}, Failed: ${payload.failedCount ?? 0}, Skipped: ${payload.skippedCount ?? 0}`,
        'info',
      )
      await fetchAll()
    } catch {
      showAlert('Failed to send announcement emails.', 'error')
    } finally {
      setSendingAnnouncement(false)
    }
  }

  // ── Client-side sort helper ──────────────────────────────────────────────
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortField) return 0
    let aVal = ''
    let bVal = ''
    if (sortField === 'role') {
      // Sort by privilege level so ADMIN > JUDGE > MODERATOR > COMPETITOR
      const aPriority = ROLE_PRIORITY[getPrimaryRole(a.roles)] ?? 0
      const bPriority = ROLE_PRIORITY[getPrimaryRole(b.roles)] ?? 0
      return sortDir === 'asc'
        ? aPriority - bPriority
        : bPriority - aPriority
    }
    if (sortField === 'email') {
      aVal = a.email.toLowerCase()
      bVal = b.email.toLowerCase()
    }
    if (sortField === 'name') {
      aVal = a.fullName.toLowerCase()
      bVal = b.fullName.toLowerCase()
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      size={11}
      className="ml-1 inline-block opacity-50 transition-opacity group-hover:opacity-100"
      style={{
        color:
          sortField === field ? 'var(--accent-cyan)' : 'var(--text-muted)',
        opacity: sortField === field ? 1 : undefined,
      }}
    />
  )
  // ────────────────────────────────────────────────────────────────────────

  // Badge colours per role
  const ROLE_BADGE: Record<string, { bg: string; color: string; label: string }> =
    {
      ADMIN: {
        bg: 'rgba(255,171,0,0.12)',
        color: 'var(--accent-amber)',
        label: 'ADMIN',
      },
      JUDGE: {
        bg: 'rgba(0,200,255,0.1)',
        color: 'var(--accent-cyan)',
        label: 'JUDGE',
      },
      MODERATOR: {
        bg: 'rgba(0,230,118,0.1)',
        color: 'var(--accent-green)',
        label: 'MODERATOR',
      },
      COMPETITOR: {
        bg: 'rgba(255,255,255,0.05)',
        color: 'var(--text-secondary)',
        label: 'COMPETITOR',
      },
    }

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
                Are you sure you want to{' '}
                <strong>{confirmAction.type}</strong> team{' '}
                <strong>{confirmAction.teamName}</strong>?
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
                style={{
                  background:
                    confirmAction.type === 'PROMOTE' ||
                    confirmAction.type === 'RESTORE'
                      ? 'var(--accent-cyan)'
                      : 'var(--accent-red)',
                }}
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
          <span>
            {loading ? 'SYNCHRONIZING...' : 'ADMINISTRATIVE TERMINAL'}
          </span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-3xl text-white sm:text-4xl md:text-5xl">
            Command Center
          </h1>
          <Link
            href="/admin/email"
            className="inline-flex items-center gap-2 rounded border border-(--accent-cyan) bg-[rgba(0,229,255,0.07)] px-4 py-2.5 text-xs font-semibold text-(--accent-cyan) no-underline transition hover:bg-[rgba(0,229,255,0.14)]"
          >
            <Mail size={14} />
            Email Dispatch
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'REGISTERED USERS',
            value: totalUsers.toLocaleString(),
            change: 'Platform Wide',
            changeColor: 'var(--accent-green)',
            color: 'var(--accent-cyan)',
          },
          {
            label: 'ACTIVE TEAMS',
            value: totalTeams.toLocaleString(),
            change: 'Registered Squads',
            changeColor: 'var(--accent-green)',
            color: 'var(--accent-green)',
          },
          {
            label: 'TOTAL PROPOSALS',
            value: teams
              .reduce((acc, t) => acc + (t.submissions?.length || 0), 0)
              .toLocaleString(),
            change: 'Submitted PDFs',
            changeColor: 'var(--text-muted)',
            color: 'var(--accent-amber)',
          },
          {
            label: 'CURRENT PHASE',
            value: currentPhase.title,
            change: `Deadline ${phaseDeadline}`,
            changeColor: 'var(--accent-cyan)',
            color: 'white',
          },
        ].map((s, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 border-l-2 bg-(--bg-surface) px-6 py-5"
            style={{ borderLeftColor: s.color }}
          >
            <div className="font-mono text-[11px] tracking-[0.1em] text-(--text-muted)">
              {s.label}
            </div>
            <div
              className="font-display text-3xl font-bold leading-none sm:text-4xl"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div
              className="text-xs font-medium"
              style={{ color: s.changeColor }}
            >
              {s.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main panels */}
        <div className="flex flex-col gap-6">
          {/* ── User Management ─────────────────────────────────────────── */}
          <div className="border-t border-white/5 bg-(--bg-surface) p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="mb-1 text-xl font-semibold text-white sm:text-2xl">
                  User Management
                </h2>
                <div className="text-[10px] tracking-[0.1em] text-(--text-muted) uppercase">
                  Registry Control & Role Assignment
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {/* Role filter */}
                <div className="w-[150px] flex-shrink-0">
                  <CustomDropdown
                    value={userRoleFilter}
                    onChange={(nextRole) => {
                      setUserRoleFilter(nextRole)
                      setUserPage(1)
                    }}
                    options={[
                      { value: 'ALL', label: 'ALL ROLES' },
                      { value: 'COMPETITOR', label: 'COMPETITOR' },
                      { value: 'MODERATOR', label: 'MODERATOR' },
                      { value: 'JUDGE', label: 'JUDGE' },
                      { value: 'ADMIN', label: 'ADMIN' },
                    ]}
                  />
                </div>
                {/* Competitor Status filter */}
                <div className="w-[170px] flex-shrink-0">
                  <CustomDropdown
                    value={userStatusFilter}
                    onChange={(nextStatus) => {
                      setUserStatusFilter(nextStatus)
                      setUserPage(1)
                    }}
                    options={[
                      { value: 'ALL', label: 'ALL STATUS' },
                      { value: 'PENDING', label: 'PENDING' },
                      { value: 'VERIFIED_COMPETITOR', label: 'VERIFIED' },
                      { value: 'INCORRECT_COMPETITOR', label: 'INCORRECT' },
                      { value: 'QUALIFIED', label: 'QUALIFIED' },
                      { value: 'DISQUALIFIED', label: 'DISQUALIFIED' },
                    ]}
                  />
                </div>
                {/* Search */}
                <div className="relative w-full sm:w-64 lg:w-72">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-2.5 text-(--text-muted)"
                  />
                  <input
                    placeholder="Search ID, Email, or Name..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setUserPage(1)
                    }}
                    className="w-full rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 pl-9 text-xs tracking-[0.05em] text-white outline-none ring-(--accent-cyan)/30 transition-all focus:border-(--accent-cyan) focus:ring-2"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    {/* Sortable: email */}
                    <th
                      className="group cursor-pointer select-none py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)"
                      onClick={() => toggleSort('email')}
                    >
                      USER IDENTIFIER
                      <SortIcon field="email" />
                    </th>
                    {/* Sortable: name */}
                    <th
                      className="group cursor-pointer select-none py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)"
                      onClick={() => toggleSort('name')}
                    >
                      USER INFORMATION
                      <SortIcon field="name" />
                    </th>
                    {/* Sortable: role */}
                    <th
                      className="group cursor-pointer select-none py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)"
                      onClick={() => toggleSort('role')}
                    >
                      ROLE ASSIGNMENT
                      <SortIcon field="role" />
                    </th>
                    <th className="py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">
                      COMP. STATUS
                    </th>
                    <th className="py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted) max-w-[180px]">
                      REASON
                    </th>
                    <th className="py-4 text-right text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((u) => {
                    const primaryRole = getPrimaryRole(u.roles)
                    const badge =
                      ROLE_BADGE[primaryRole] ?? ROLE_BADGE.COMPETITOR

                    const COMP_STATUS_STYLE: Record<string, { label: string; color: string }> = {
                      PENDING: { label: 'PENDING', color: 'var(--text-muted)' },
                      VERIFIED_COMPETITOR: { label: 'VERIFIED', color: 'var(--accent-green)' },
                      INCORRECT_COMPETITOR: { label: 'INCORRECT', color: '#ff6275' },
                      QUALIFIED: { label: 'QUALIFIED', color: 'var(--accent-cyan)' },
                      DISQUALIFIED: { label: 'DISQUALIFIED', color: '#ff6275' },
                    }
                    const compStyle = u.competitorStatus
                      ? (COMP_STATUS_STYLE[u.competitorStatus] ?? COMP_STATUS_STYLE.PENDING)
                      : COMP_STATUS_STYLE.PENDING

                    return (
                      <tr key={u.id} className="border-b border-white/[0.02]">
                        <td className="py-5">
                          <div className="mb-1 text-sm font-semibold text-white">
                            {u.email}
                          </div>
                          <div className="font-mono text-[10px] text-(--text-muted)">
                            UUID: {u.id}
                          </div>
                        </td>
                        <td className="py-5 text-sm text-(--text-secondary)">
                          <div>{u.fullName}</div>
                          <div className="text-[10px] text-(--text-muted)">
                            {u.firstName || '-'} {u.lastName || ''}
                          </div>
                          <div className="text-[10px] text-(--text-muted)">
                            {u.university || 'University not set'}
                            {u.yearOfStudy ? ` · Year ${u.yearOfStudy}` : ''}
                          </div>
                          <div className="text-[10px] text-(--text-muted)">
                            {u.phoneNumber || 'Phone not set'}
                          </div>
                          <div className="text-[10px] text-(--text-muted)">
                            {u.address || 'Address not set'}
                          </div>
                          <div className="text-[10px] text-(--text-muted)">
                            Registration Date:{' '}
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString()
                              : '-'}
                          </div>
                          <div className="text-[10px] text-(--text-muted)">
                            Registration Time:{' '}
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleTimeString()
                              : '-'}
                          </div>
                          <div className="text-[10px] text-(--text-muted)">
                            Profile:{' '}
                            {u.profileCompleted ? 'Completed' : 'Incomplete'} ·
                            ID: {u.idCardUploaded ? 'Uploaded' : 'Missing'}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {u.avatarUrl && (
                              <button
                                type="button"
                                onClick={() => openUserUpload(u.id, 'avatar')}
                                className="rounded border border-(--accent-cyan) px-2 py-1 text-[10px] text-(--accent-cyan)"
                              >
                                View Avatar
                              </button>
                            )}
                            {u.idCardUploaded && (
                              <button
                                type="button"
                                onClick={() =>
                                  openUserUpload(u.id, 'id-card')
                                }
                                className="rounded border border-(--accent-green) px-2 py-1 text-[10px] text-(--accent-green)"
                              >
                                View ID Card
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-5">
                          <div className="flex flex-col gap-2">
                            {/* Current role badge */}
                            <span
                              className="inline-block w-fit rounded px-2 py-0.5 text-[10px] font-bold tracking-[0.08em]"
                              style={{
                                background: badge.bg,
                                color: badge.color,
                              }}
                            >
                              {badge.label}
                            </span>
                            {/* Role change dropdown */}
                            <CustomDropdown
                              className="w-[150px]"
                              value={primaryRole}
                              onChange={(nextRole) =>
                                assignRole(u.id, nextRole)
                              }
                              options={[
                                {
                                  value: 'COMPETITOR',
                                  label: 'COMPETITOR',
                                },
                                {
                                  value: 'MODERATOR',
                                  label: 'MODERATOR',
                                },
                                { value: 'JUDGE', label: 'JUDGE' },
                                { value: 'ADMIN', label: 'ADMIN' },
                              ]}
                            />
                          </div>
                        </td>
                        {/* Competitor Status column */}
                        <td className="py-5">
                          <span
                            className="inline-block rounded px-2 py-0.5 text-[10px] font-bold tracking-[0.07em]"
                            style={{ color: compStyle.color, background: `${compStyle.color}18` }}
                          >
                            {compStyle.label}
                          </span>
                        </td>
                        {/* Reason column */}
                        <td className="py-5 max-w-[180px]">
                          {u.moderatorNote ? (
                            <span
                              className="block text-[10px] text-(--text-muted) italic leading-relaxed"
                              title={u.moderatorNote}
                              style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                            >
                              {u.moderatorNote}
                            </span>
                          ) : (
                            <span className="text-[10px] text-(--border-subtle)">—</span>
                          )}
                        </td>
                        <td className="py-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: badge.color }}
                            />
                            <span
                              className="text-[11px] font-semibold tracking-[0.05em]"
                              style={{ color: badge.color }}
                            >
                              {primaryRole === 'ADMIN'
                                ? 'RESTRICTED'
                                : primaryRole === 'COMPETITOR'
                                  ? 'ACTIVE'
                                  : 'VERIFIED'}
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteUser(u.id, u.email)}
                              className="ml-2 inline-flex items-center gap-1 rounded border border-[rgba(255,23,68,0.4)] px-2 py-1 text-[10px] text-(--accent-red)"
                            >
                              <Trash2 size={10} />
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {sortedUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-sm text-(--text-muted)"
                      >
                        ไม่พบผู้ใช้ที่ตรงกับคำค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-4 text-xs text-(--text-muted) sm:flex-row sm:items-center sm:justify-between">
              <div>
                Showing users {userFrom}–{userTo} of {totalUsers}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={userPage <= 1 || loading}
                  className="rounded border border-(--border-subtle) px-3 py-1.5 text-xs text-(--text-secondary) disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="min-w-[84px] text-center text-(--text-secondary)">
                  Page {userPage}/{totalUserPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setUserPage((p) => Math.min(totalUserPages, p + 1))
                  }
                  disabled={userPage >= totalUserPages || loading}
                  className="rounded border border-(--border-subtle) px-3 py-1.5 text-xs text-(--text-secondary) disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* ── Team Management ─────────────────────────────────────────── */}
          <div className="border-t border-white/5 bg-(--bg-surface) p-4 sm:p-6 lg:p-8">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <h2 className="text-xl font-semibold text-white sm:text-2xl">
                Team Management
              </h2>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
                <div className="w-full sm:w-[230px]">
                  <CustomDropdown
                    value={teamTrackFilter}
                    onChange={(nextTrack) => {
                      setTeamTrackFilter(nextTrack)
                      setTeamPage(1)
                    }}
                    options={[
                      { value: 'ALL', label: 'ALL TRACKS' },
                      {
                        value: 'SMART_AGRICULTURE',
                        label: 'SMART AGRICULTURE',
                      },
                      {
                        value: 'DISASTER_FLOOD_RESPONSE',
                        label: 'DISASTER FLOOD RESPONSE',
                      },
                    ]}
                  />
                </div>
                <div className="relative w-full md:w-auto">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-2.5 text-(--text-muted)"
                  />
                  <input
                    placeholder="SEARCH TEAM NAME"
                    value={teamSearch}
                    onChange={(e) => {
                      setTeamSearch(e.target.value)
                      setTeamPage(1)
                    }}
                    className="w-full rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 pl-9 text-xs tracking-[0.05em] text-white outline-none md:w-[260px]"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">
                      TEAM NAME
                    </th>
                    <th className="py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">
                      MEMBERS
                    </th>
                    <th className="py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">
                      SCORE (M)
                    </th>
                    <th className="py-4 text-right text-[11px] font-semibold tracking-[0.1em] text-(--text-muted)">
                      STATE PROMOTION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t, i) => (
                    <tr key={i} className="border-b border-white/[0.02]">
                      <td className="py-5">
                        <div className="text-[15px] font-semibold text-(--accent-cyan)">
                          {t.name}
                        </div>
                      </td>
                      <td className="py-5 text-sm text-(--text-secondary)">
                        <div>{(t.members || []).length} Members</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {t.members?.slice(0, 3).map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-1"
                            >
                              {member.user.avatarUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openUserUpload(member.user.id, 'avatar')
                                  }
                                  className="rounded border border-(--accent-cyan) px-2 py-1 text-[10px] text-(--accent-cyan)"
                                >
                                  {member.user.fullName.split(' ')[0]} avatar
                                </button>
                              )}
                              {member.user.idCardUploaded && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openUserUpload(member.user.id, 'id-card')
                                  }
                                  className="rounded border border-(--accent-green) px-2 py-1 text-[10px] text-(--accent-green)"
                                >
                                  ID
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-5 text-sm text-white">
                        {t.score?.toFixed(4) || 'N/A'}
                      </td>
                      <td className="py-5 text-right">
                        {t.currentStatus === 'FINALIST' ? (
                          <div className="inline-flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 rounded border border-(--accent-green) bg-[rgba(0,230,118,0.1)] px-3 py-1.5 text-[11px] font-bold tracking-[0.05em] text-(--accent-green)">
                              <Check size={12} /> FINALIST
                            </span>
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: 'REVOKE',
                                  teamId: t.id,
                                  teamName: t.name,
                                })
                              }
                              className="border-none bg-transparent text-[10px] text-(--text-muted) underline"
                            >
                              REVOKE
                            </button>
                          </div>
                        ) : t.currentStatus === 'REJECTED' ? (
                          <div className="inline-flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 rounded border border-(--accent-red) bg-[rgba(255,23,68,0.1)] px-3 py-1.5 text-[11px] font-bold tracking-[0.05em] text-(--accent-red)">
                              <X size={12} /> DISQUALIFIED
                            </span>
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: 'RESTORE',
                                  teamId: t.id,
                                  teamName: t.name,
                                })
                              }
                              className="rounded border border-(--accent-cyan) bg-transparent px-3 py-1.5 text-[10px] text-(--accent-cyan)"
                            >
                              RESTORE TO FINALIST
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-3">
                            <span className="inline-flex items-center rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-1.5 text-[11px] font-semibold tracking-[0.05em] text-(--text-muted)">
                              NOT FINALIZED
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteTeam(t.id, t.name)}
                              className="inline-flex items-center gap-1 border border-[rgba(255,23,68,0.4)] bg-transparent px-4 py-2 text-[10px] font-semibold tracking-[0.05em] text-(--accent-red)"
                            >
                              <Trash2 size={10} />
                              DELETE
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-4 text-xs text-(--text-muted) sm:flex-row sm:items-center sm:justify-between">
              <div>
                Showing teams {teamFrom}–{teamTo} of {totalTeams}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTeamPage((p) => Math.max(1, p - 1))}
                  disabled={teamPage <= 1 || loading}
                  className="rounded border border-(--border-subtle) px-3 py-1.5 text-xs text-(--text-secondary) disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="min-w-[84px] text-center text-(--text-secondary)">
                  Page {teamPage}/{totalTeamPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setTeamPage((p) => Math.min(totalTeamPages, p + 1))
                  }
                  disabled={teamPage >= totalTeamPages || loading}
                  className="rounded border border-(--border-subtle) px-3 py-1.5 text-xs text-(--text-secondary) disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Data Extraction */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Data Extraction
            </h3>
            <button
              type="button"
              onClick={sendAnnouncementEmails}
              disabled={!announcementStatus?.enabled || sendingAnnouncement}
              className="mb-3 flex w-full items-center justify-between border-l-2 border-transparent bg-(--bg-surface) px-5 py-4 text-left transition enabled:hover:border-(--accent-cyan) disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div>
                <div className="font-mono mb-1 text-[10px] tracking-[0.1em] text-(--text-muted)">
                  ANNOUNCEMENT MAILER
                </div>
                <div className="text-sm font-medium text-white">
                  {sendingAnnouncement
                    ? 'Sending Emails...'
                    : 'Send Announcement Emails'}
                </div>
                <div className="mt-1 text-[11px] text-(--text-muted)">
                  Available after: {announcementDeadlineText}
                </div>
                {announcementStatus && (
                  <div className="mt-1 text-[11px] text-(--text-muted)">
                    Sent: {announcementStatus.sentCount} · Failed:{' '}
                    {announcementStatus.failedCount}
                  </div>
                )}
              </div>
              <Mail size={18} className="text-(--accent-cyan)" />
            </button>
            <div className="flex flex-col gap-3">
              {exportCards.map((exp) => (
                <div
                  key={exp.type}
                  onClick={() => exportData(exp.type)}
                  className="flex cursor-pointer items-center justify-between border-l-2 border-transparent bg-(--bg-surface) px-5 py-4 transition hover:border-(--accent-cyan)"
                >
                  <div>
                    <div className="font-mono mb-1 text-[10px] tracking-[0.1em] text-(--text-muted)">
                      {exp.label}
                    </div>
                    <div className="text-sm font-medium text-white">
                      {exp.title}
                    </div>
                  </div>
                  <exp.icon size={18} className="text-(--accent-cyan)" />
                </div>
              ))}
            </div>
          </div>

          {/* Live Ops Log */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-[0.1em] text-(--text-secondary)">
                LIVE OPERATIONAL LOG
              </h3>
              <span className="h-2 w-2 rounded-full bg-(--accent-green) shadow-[0_0_10px_var(--accent-green)]" />
            </div>

            <div className="flex flex-col gap-3">
              {logs.slice(0, 4).map((log) => (
                <div key={log.id} className="bg-(--bg-surface) p-4">
                  <div className="mb-2 flex justify-between gap-3">
                    <span className="font-mono text-[10px] text-(--text-muted)">
                      LOG_ID: {log.entityId}
                    </span>
                    <span className="font-mono text-[10px] text-(--text-muted)">
                      {formatAuditLogTimestamp(log.createdAt).timeLabel} UTC
                    </span>
                  </div>
                  <div className="text-xs leading-relaxed text-(--text-secondary)">
                    {log.action.includes('Warning') ? (
                      <>
                        {log.action.split('Submission Server')[0]}{' '}
                        <span style={{ color: 'var(--accent-amber)' }}>
                          Submission Server
                          {log.action.split('Submission Server')[1]}
                        </span>
                      </>
                    ) : (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: log.action.replace(
                            /(Orbital Pioneers|Finalist|sarah\.connor|GitHub API|Judge)/g,
                            '<span style="color:var(--accent-green)">$1</span>',
                          ),
                        }}
                      />
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