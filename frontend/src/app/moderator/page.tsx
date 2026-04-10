'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Check, X, RefreshCw, FileText, ExternalLink } from 'lucide-react'
import CustomDropdown from '@/components/CustomDropdown'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Team { name: string; track: string }
interface File { fileKey: string; originalName: string }
interface Review { status: 'PASS' | 'DISQUALIFIED' }
interface Submission { id: string; submittedAt: string; team: Team; files: File[]; moderatorReview: Review | null }
interface TeamOverviewRow {
  id: string
  name: string
  institution: string
  leader?: { fullName?: string; email?: string }
  members: Array<{ user: { id: string; fullName?: string; email?: string; idCardUploaded?: boolean } }>
}

const TRACK_LABELS: Record<string, string> = {
  SMART_AGRICULTURE: 'Smart Agriculture',
  DISASTER_FLOOD_RESPONSE: 'Disaster & Flood Response',
}

function formatTrackLabel(track: string) {
  return TRACK_LABELS[track] || track.replace(/_/g, ' ')
}

function ModeratorContent() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [teamOverview, setTeamOverview] = useState<TeamOverviewRow[]>([])
  const [teamOverviewTotal, setTeamOverviewTotal] = useState(0)
  const [teamOverviewPage, setTeamOverviewPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [trackFilter, setTrackFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [previewSubmissionId, setPreviewSubmissionId] = useState<string | null>(null)
  const TEAM_OVERVIEW_LIMIT = 10
  const totalTeamOverviewPages = Math.max(1, Math.ceil(teamOverviewTotal / TEAM_OVERVIEW_LIMIT))

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ limit: '50' })
      if (trackFilter) qs.set('track', trackFilter)
      if (statusFilter) qs.set('status', statusFilter)

      const teamsQs = new URLSearchParams({ page: String(teamOverviewPage), limit: String(TEAM_OVERVIEW_LIMIT) })
      if (trackFilter) teamsQs.set('track', trackFilter)

      const [res, teamsRes] = await Promise.all([
        fetch(`${API}/api/v1/mod/submissions?${qs.toString()}`, { credentials: 'include' }),
        fetch(`${API}/api/v1/admin/teams?${teamsQs.toString()}`, { credentials: 'include' }),
      ])

      if (res.ok) {
        const d = await res.json()
        setSubmissions(d.data || [])
        setTotal(d.total || 0)
      }
      if (teamsRes.ok) {
        const d = await teamsRes.json()
        setTeamOverview((d.data || []) as TeamOverviewRow[])
        setTeamOverviewTotal(d.total || 0)
      }
    } finally {
      setLoading(false)
    }
  }, [trackFilter, statusFilter, teamOverviewPage])

  useEffect(() => { fetchSubmissions() }, [fetchSubmissions])

  const submitReview = async (submissionId: string, status: 'PASS' | 'DISQUALIFIED') => {
    try {
      const res = await fetch(`${API}/api/v1/mod/submissions/${submissionId}/review`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: '' })
      })
      if (res.ok) fetchSubmissions()
    } catch (e) { console.error('Review error:', e) }
  }

  const visibleSubmissions = submissions.filter((sub) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return sub.team.name.toLowerCase().includes(q)
  })

  const previewSubmission = visibleSubmissions.find((sub) => sub.id === previewSubmissionId) || null
  const previewUrl = previewSubmission ? `${API}/api/v1/submissions/${previewSubmission.id}/view` : ''

  return (
    <div className="flex flex-col min-h-screen bg-(--bg-base)">
      {/* Header */}
      <div className="border-b border-(--border-subtle) bg-(--bg-surface) px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl text-white font-bold">Content Moderation</h1>
            <p className="text-xs sm:text-sm text-(--text-secondary) mt-1 sm:mt-2">Pre-screen submissions before they move to Judge scoring.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            {loading && <span className="text-(--text-muted)">Loading...</span>}
            <span className="text-(--text-muted)">Submissions: <span className="text-(--accent-cyan) font-semibold">{total}</span></span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="border-b border-(--border-subtle) bg-[rgba(255,255,255,0.01)] px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {[
            { label: 'PENDING', value: visibleSubmissions.filter(s => !s.moderatorReview).length, color: 'text-(--accent-amber)' },
            { label: 'APPROVED', value: visibleSubmissions.filter(s => s.moderatorReview?.status === 'PASS').length, color: 'text-(--accent-green)' },
            { label: 'DISQUALIFIED', value: visibleSubmissions.filter(s => s.moderatorReview?.status === 'DISQUALIFIED').length, color: 'text-[#ff6275]' },
            { label: 'TOTAL', value: total, color: 'text-white' },
          ].map((stat, i) => (
            <div key={i} className="bg-(--bg-base) p-2 sm:p-3 lg:p-4 rounded border border-(--border-subtle)">
              <div className="text-[7px] sm:text-[8px] lg:text-xs text-(--text-muted) tracking-widest uppercase mb-1">{stat.label}</div>
              <div className={`text-lg sm:text-2xl lg:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-(--border-subtle) bg-(--bg-surface) px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
            <CustomDropdown
              className="min-w-[190px]"
              value={trackFilter}
              onChange={(value) => {
                setTrackFilter(value)
                setTeamOverviewPage(1)
              }}
              options={[
                { value: '', label: 'ALL TRACKS' },
                { value: 'SMART_AGRICULTURE', label: 'Smart Agriculture' },
                { value: 'DISASTER_FLOOD_RESPONSE', label: 'Disaster & Flood Response' },
              ]}
            />
            <CustomDropdown
              className="min-w-[160px]"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'ALL STATUS' },
                { value: 'PASS', label: 'Approved' },
                { value: 'DISQUALIFIED', label: 'Disqualified' },
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="bg-(--bg-base) border border-(--border-subtle) rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder-(--text-muted) outline-none flex-1 sm:flex-initial sm:w-40" />
            <button onClick={() => fetchSubmissions()} className="p-1.5 sm:p-2 bg-(--bg-base) border border-(--border-subtle) rounded text-white hover:bg-(--bg-elevated) transition">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="rounded border border-(--border-subtle) bg-(--bg-surface) p-4 sm:p-5">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">Team Information Overview</h2>
            <p className="text-[11px] sm:text-xs text-(--text-muted)">
              Verify team member completeness before moderation decisions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {teamOverview.map((team) => {
              const missingMembers = team.members.filter((member) => !member.user.idCardUploaded).length
              return (
                <div key={team.id} className="rounded border border-(--border-subtle) bg-(--bg-base) p-3">
                  <div className="text-xs font-semibold text-white truncate">{team.name}</div>
                  <div className="text-[11px] text-(--text-muted) truncate">{team.institution || 'Institution not set'}</div>
                  <div className="mt-2 text-[11px] text-(--text-secondary)">
                    Leader: {team.leader?.fullName || team.leader?.email || '-'}
                  </div>
                  <div className="text-[11px] text-(--text-secondary)">
                    Members: {team.members.length} · Missing ID: {missingMembers}
                  </div>
                  <div className="mt-2 space-y-1 border-t border-(--border-subtle) pt-2">
                    {team.members.slice(0, 4).map((member, idx) => (
                      <div key={`${team.id}-${idx}`} className="flex items-center justify-between gap-2 text-[10px] text-(--text-muted)">
                        <span className="truncate">
                          {member.user.fullName || member.user.email || 'Unnamed member'} · ID{' '}
                          {member.user.idCardUploaded ? 'Uploaded' : 'Missing'}
                        </span>
                        {member.user.idCardUploaded ? (
                          <a
                            href={`${API}/api/v1/admin/users/${member.user.id}/uploads/id-card/view`}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 rounded border border-(--accent-cyan) px-1.5 py-0.5 text-[9px] text-(--accent-cyan) no-underline"
                          >
                            View ID
                          </a>
                        ) : null}
                      </div>
                    ))}
                    {team.members.length > 4 && (
                      <div className="text-[10px] text-(--text-muted)">
                        +{team.members.length - 4} more members
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-(--border-subtle) pt-3 text-[11px] text-(--text-muted) sm:flex-row sm:items-center sm:justify-between">
            <div>
              Page {teamOverviewPage} of {totalTeamOverviewPages} · Teams {teamOverview.length} / {teamOverviewTotal}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTeamOverviewPage((p) => Math.max(1, p - 1))}
                disabled={teamOverviewPage <= 1 || loading}
                className="rounded border border-(--border-subtle) px-2 py-1 text-[11px] text-(--text-secondary) disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setTeamOverviewPage((p) => Math.min(totalTeamOverviewPages, p + 1))}
                disabled={teamOverviewPage >= totalTeamOverviewPages || loading}
                className="rounded border border-(--border-subtle) px-2 py-1 text-[11px] text-(--text-secondary) disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.05)]">
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[8px] sm:text-xs text-(--text-muted) font-semibold tracking-widest">TEAM</th>
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[8px] sm:text-xs text-(--text-muted) font-semibold tracking-widest hidden sm:table-cell">TRACK</th>
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[8px] sm:text-xs text-(--text-muted) font-semibold tracking-widest hidden md:table-cell">SUBMITTED</th>
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[8px] sm:text-xs text-(--text-muted) font-semibold tracking-widest">STATUS</th>
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[8px] sm:text-xs text-(--text-muted) font-semibold tracking-widest text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {visibleSubmissions.map(sub => (
              <tr key={sub.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.01)] transition">
                <td className="py-2 sm:py-3 px-2 sm:px-3 font-semibold text-xs sm:text-sm text-white truncate">{sub.team.name}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 text-(--text-secondary) hidden sm:table-cell truncate text-xs sm:text-sm">{formatTrackLabel(sub.team.track)}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 font-mono text-(--text-muted) hidden md:table-cell text-[8px] sm:text-xs">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-3">
                  {sub.moderatorReview ? (
                    <span className={`inline-block text-[8px] sm:text-xs font-bold py-1 px-2 rounded border ${sub.moderatorReview.status === 'PASS' ? 'text-(--accent-green) border-[rgba(0,230,118,0.3)] bg-[rgba(0,230,118,0.1)]' : 'text-[#ff6275] border-[rgba(255,98,117,0.3)] bg-[rgba(255,98,117,0.1)]'}`}>
                      ■ {sub.moderatorReview.status}
                    </span>
                  ) : (
                    <span className="text-(--accent-amber) text-[8px] sm:text-xs font-semibold">PENDING</span>
                  )}
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 text-right">
                  <div className="inline-flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => setPreviewSubmissionId(sub.id)}
                      className="p-1 sm:p-1.5 bg-[rgba(0,229,255,0.1)] border border-(--accent-cyan) text-(--accent-cyan) rounded hover:bg-[rgba(0,229,255,0.2)] transition"
                      title="Preview PDF"
                    >
                      <FileText size={14} />
                    </button>
                    <button onClick={() => submitReview(sub.id, 'PASS')} className="p-1 sm:p-1.5 bg-[rgba(0,230,118,0.1)] border border-(--accent-green) text-(--accent-green) rounded hover:bg-[rgba(0,230,118,0.2)] transition" title={sub.moderatorReview ? 'Re-review and approve' : 'Approve'}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => submitReview(sub.id, 'DISQUALIFIED')} className="p-1 sm:p-1.5 bg-[rgba(255,98,117,0.1)] border border-[#ff6275] text-[#ff6275] rounded hover:bg-[rgba(255,98,117,0.2)] transition" title={sub.moderatorReview ? 'Re-review and disqualify' : 'Disqualify'}>
                      <X size={14} />
                    </button>
                    {sub.moderatorReview && (
                      <span className="ml-1 text-[9px] sm:text-[10px] text-(--text-muted)">Re-review</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewSubmission && (
        <div className="fixed inset-0 z-[140] bg-black/80 p-3 sm:p-6">
          <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-lg border border-(--border-subtle) bg-(--bg-surface)">
            <div className="flex items-center justify-between border-b border-(--border-subtle) px-4 py-3">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                <FileText size={15} className="text-(--accent-cyan)" />
                {previewSubmission.team.name} Proposal
              </div>
              <div className="inline-flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-(--border-subtle) px-3 py-1 text-xs text-(--text-secondary) no-underline"
                >
                  <ExternalLink size={13} />
                  New Tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewSubmissionId(null)}
                  className="rounded border border-(--border-subtle) px-3 py-1 text-xs text-(--text-secondary)"
                >
                  Close
                </button>
              </div>
            </div>

            {previewUrl ? (
              <iframe
                title={`Preview ${previewSubmission.team.name}`}
                src={previewUrl}
                className="h-full w-full"
              />
            ) : (
              <div className="m-4 rounded border border-(--accent-amber) bg-[rgba(255,167,38,0.08)] px-3 py-2 text-xs text-(--accent-amber)">
                Proposal PDF is not available for this submission.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ModeratorPage() {
  return (
    <AuthProvider>
      <AppShell>
        <ModeratorContent />
      </AppShell>
    </AuthProvider>
  )
}
