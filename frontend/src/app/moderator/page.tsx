'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Check, X, RefreshCw, FileText, ExternalLink } from 'lucide-react'
import CustomDropdown from '@/components/CustomDropdown'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Team { name: string; track: string }
interface File { fileKey: string; originalName: string }
interface Review { status: 'PASS' | 'DISQUALIFIED'; note?: string | null; tags?: string[] }
interface Submission { id: string; submittedAt: string; team: Team; files: File[]; moderatorReview: Review | null; version: number }
interface TeamOverviewRow {
  id: string
  name: string
  institution: string
  track: string
  currentStatus: string
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

function ReviewModal({
  submission,
  status,
  onConfirm,
  onCancel,
}: {
  submission: Submission
  status: 'PASS' | 'DISQUALIFIED'
  onConfirm: (note: string, tags: string[]) => void
  onCancel: () => void
}) {
  const [note, setNote] = useState(submission.moderatorReview?.note || '')
  const [tagsInput, setTagsInput] = useState(submission.moderatorReview?.tags?.join(', ') || '')
  const [touched, setTouched] = useState(false)
  const isReject = status === 'DISQUALIFIED'
  const invalid = isReject && touched && note.trim().length === 0

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-lg border bg-(--bg-surface) p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)] ${isReject ? 'border-[rgba(255,98,117,0.4)]' : 'border-[rgba(0,230,118,0.4)]'}`}>
        <div className="mb-1 flex items-center gap-2">
          {isReject ? <X size={16} className="text-[#ff6275]" /> : <Check size={16} className="text-(--accent-green)" />}
          <h2 className="text-base font-bold tracking-[0.05em] text-white uppercase">
            {isReject ? 'Disqualify Submission' : 'Approve Submission'}
          </h2>
        </div>
        <p className="mb-4 text-sm text-(--text-secondary)">
          Team: <strong className="text-white">{submission.team.name}</strong>
        </p>

        {/* Tags Input */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">Classification Tags</label>
          <input
            autoFocus={!isReject}
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. AI, Satellite, Agriculture (comma separated)"
            className="w-full rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-sm text-white outline-none focus:border-(--accent-cyan) transition placeholder:opacity-30"
          />
          <p className="mt-1 text-[10px] text-(--text-muted)">Separate tags with commas.</p>
        </div>

        {/* Note / Rejection Reason */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">
            {isReject ? 'Rejection Reason (Required)' : 'Internal Note (Optional)'}
          </label>
          <textarea
            autoFocus={isReject}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={isReject ? "Describe why this submission is being disqualified..." : "Add any internal notes for judges..."}
            className={`min-h-[80px] w-full rounded border bg-(--bg-base) px-3 py-2 text-sm text-white outline-none transition ${
              invalid ? 'border-[#ff6275]' : 'border-(--border-subtle) focus:border-(--accent-cyan)'
            }`}
          />
          {invalid && (
            <p className="mt-1 text-xs text-[#ff6275]">A reason is required to proceed.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded border border-(--border-subtle) bg-transparent px-5 py-2 text-xs font-semibold text-(--text-muted)">
            CANCEL
          </button>
          <button
            onClick={() => {
              setTouched(true)
              if (!isReject || note.trim().length > 0) {
                const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
                onConfirm(note.trim(), tags)
              }
            }}
            className={`rounded border-none px-5 py-2 text-xs font-bold text-white shadow-lg hover:scale-105 transition-transform ${isReject ? 'bg-[#ff6275] shadow-[0_4px_12px_rgba(255,98,117,0.3)]' : 'bg-(--accent-green) shadow-[0_4px_12px_rgba(0,230,118,0.3)]'}`}
          >
            CONFIRM {status === 'PASS' ? 'APPROVE' : 'DISQUALIFY'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModeratorContent() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [teamOverview, setTeamOverview] = useState<TeamOverviewRow[]>([])
  const [teamOverviewTotal, setTeamOverviewTotal] = useState(0)
  const [teamOverviewPage, setTeamOverviewPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ PENDING: 0, APPROVED: 0, DISQUALIFIED: 0, DRAFT: 0, TOTAL: 0 })
  const [loading, setLoading] = useState(true)
  const [trackFilter, setTrackFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [previewSubmissionId, setPreviewSubmissionId] = useState<string | null>(null)
  const [reviewTarget, setReviewTarget] = useState<{ submission: Submission, status: 'PASS' | 'DISQUALIFIED' } | null>(null)
  const [submissionsPage, setSubmissionsPage] = useState(1)
  const SUBMISSIONS_LIMIT = 50
  const totalSubmissionsPages = Math.max(1, Math.ceil(total / SUBMISSIONS_LIMIT))
  const TEAM_OVERVIEW_LIMIT = 10
  const totalTeamOverviewPages = Math.max(1, Math.ceil(teamOverviewTotal / TEAM_OVERVIEW_LIMIT))

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(submissionsPage), limit: String(SUBMISSIONS_LIMIT) })
      if (trackFilter) qs.set('track', trackFilter)
      if (statusFilter) qs.set('status', statusFilter)
      if (search.trim()) qs.set('search', search.trim())

      const teamsQs = new URLSearchParams({ page: String(teamOverviewPage), limit: String(TEAM_OVERVIEW_LIMIT) })
      if (trackFilter) teamsQs.set('track', trackFilter)
      if (search.trim()) teamsQs.set('search', search.trim())

      const [res, teamsRes] = await Promise.all([
        fetch(`${API}/api/v1/mod/submissions?${qs.toString()}`, { credentials: 'include' }),
        fetch(`${API}/api/v1/admin/teams?${teamsQs.toString()}`, { credentials: 'include' }),
      ])

      if (res.ok) {
        const d = await res.json()
        setSubmissions(d.data || [])
        setTotal(d.total || 0)
        if (d.counts) setStats(d.counts)
      }
      if (teamsRes.ok) {
        const d = await teamsRes.json()
        setTeamOverview((d.data || []) as TeamOverviewRow[])
        setTeamOverviewTotal(d.total || 0)
      }
    } finally {
      setLoading(false)
    }
  }, [trackFilter, statusFilter, teamOverviewPage, submissionsPage])

  useEffect(() => { fetchSubmissions() }, [fetchSubmissions])

  const submitReview = async (submissionId: string, status: 'PASS' | 'DISQUALIFIED', note = '', tags: string[] = []) => {
    try {
      const res = await fetch(`${API}/api/v1/mod/submissions/${submissionId}/review`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note, tags })
      })
      if (res.ok) {
        fetchSubmissions()
        setReviewTarget(null)
      } else {
        const d = await res.json().catch(() => ({}))
        alert(d.error || 'Failed to submit review')
      }
    } catch (e) { 
      console.error('Review error:', e)
      alert('Network error during review submission')
    }
  }

  const visibleSubmissions = submissions

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {[
            { label: 'NOT SUBMITTED', value: stats.DRAFT, color: 'text-(--text-muted)' },
            { label: 'PENDING', value: stats.PENDING, color: 'text-(--accent-amber)' },
            { label: 'APPROVED', value: stats.APPROVED, color: 'text-(--accent-green)' },
            { label: 'DISQUALIFIED', value: stats.DISQUALIFIED, color: 'text-[#ff6275]' },
            { label: 'TOTAL TEAMS', value: stats.TOTAL, color: 'text-white' },
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
            <input 
              placeholder="Search Team, Member, Email, UID..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && fetchSubmissions()}
              className="bg-(--bg-base) border border-(--border-subtle) rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder-(--text-muted) outline-none flex-1 sm:flex-initial sm:w-64" 
            />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamOverview.map((team) => {
              const missingMembers = team.members.filter((member) => !member.user.idCardUploaded).length
              return (
                <div key={team.id} className="rounded-lg border border-(--border-subtle) bg-(--bg-base) p-4 sm:p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-bold text-white break-words leading-tight">{team.name}</div>
                    <div className="shrink-0 text-[9px] font-mono text-(--text-muted) bg-(--bg-elevated) px-1.5 py-0.5 rounded border border-(--border-subtle)">
                      UID: {team.id.slice(0, 8)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[rgba(0,229,255,0.05)] border border-[rgba(0,229,255,0.2)] text-(--accent-cyan) uppercase tracking-wider">
                      {formatTrackLabel(team.track)}
                    </span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-(--text-secondary) uppercase tracking-wider">
                      {team.currentStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-(--text-secondary) break-words">{team.institution || 'Institution not set'}</div>
                  <div className="mt-3 text-xs text-(--text-secondary) break-words">
                    <span className="font-semibold text-white">Leader:</span> {team.leader?.fullName || team.leader?.email || '-'}
                  </div>
                  <div className="text-xs text-(--text-secondary) mb-3">
                    <span className="font-semibold text-white">Members:</span> {team.members.length} <span className="text-(--text-muted) mx-1">·</span> <span className={missingMembers > 0 ? 'text-[#ff6275] font-semibold' : 'text-(--accent-green)'}>Missing ID: {missingMembers}</span>
                  </div>
                  <div className="mt-auto space-y-3 border-t border-[rgba(255,255,255,0.05)] pt-3">
                    {team.members.map((member, idx) => (
                      <div key={`${team.id}-${idx}`} className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs text-(--text-muted)">
                        <div className="break-words max-w-full">
                          <div className="font-medium text-[13px] text-gray-200">{member.user.fullName || member.user.email || 'Unnamed member'}</div>
                          <div className="text-[11px] text-(--text-muted)">Gmail: {member.user.email || '-'}</div>
                          <div className={`text-[11px] font-medium mt-0.5 ${member.user.idCardUploaded ? 'text-[rgba(0,230,118,0.8)]' : 'text-[rgba(255,98,117,0.8)]'}`}>
                            ID {member.user.idCardUploaded ? 'Uploaded' : 'Missing'}
                          </div>
                        </div>
                        {member.user.idCardUploaded ? (
                          <a
                            href={`${API}/api/v1/admin/users/${member.user.id}/uploads/id-card/view`}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 rounded border border-(--accent-cyan) px-2 py-1 text-[10px] font-medium text-(--accent-cyan) no-underline hover:bg-[rgba(0,229,255,0.1)] transition"
                          >
                            View ID
                          </a>
                        ) : null}
                      </div>
                    ))}
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
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[9px] sm:text-xs text-(--text-muted) font-semibold tracking-widest min-w-[120px]">TEAM</th>
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[9px] sm:text-xs text-(--text-muted) font-semibold tracking-widest hidden sm:table-cell min-w-[140px]">TRACK</th>
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[9px] sm:text-xs text-(--text-muted) font-semibold tracking-widest hidden md:table-cell min-w-[100px]">SUBMITTED</th>
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[9px] sm:text-xs text-(--text-muted) font-semibold tracking-widest text-center w-16">VERSION</th>
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[9px] sm:text-xs text-(--text-muted) font-semibold tracking-widest min-w-[110px]">STATUS</th>
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[9px] sm:text-xs text-(--text-muted) font-semibold tracking-widest min-w-[120px]">TAGS</th>
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[9px] sm:text-xs text-(--text-muted) font-semibold tracking-widest min-w-[200px] lg:min-w-[300px]">NOTE</th>
              <th className="py-2 sm:py-3 px-2 sm:px-3 text-[9px] sm:text-xs text-(--text-muted) font-semibold tracking-widest text-right min-w-[130px]">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {visibleSubmissions.map(sub => (
              <tr key={sub.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.01)] transition">
                <td className="py-3 sm:py-4 px-2 sm:px-3 font-semibold text-xs sm:text-sm text-white">
                  <div className="truncate max-w-[150px] sm:max-w-none" title={sub.team.name}>{sub.team.name}</div>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 text-(--text-secondary) hidden sm:table-cell truncate text-xs sm:text-sm">{formatTrackLabel(sub.team.track)}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 font-mono text-(--text-muted) hidden md:table-cell text-[8px] sm:text-xs">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 text-center">
                  <span className="text-[10px] font-mono text-(--accent-cyan) bg-[rgba(0,229,255,0.05)] border border-[rgba(0,229,255,0.2)] px-1.5 py-0.5 rounded">
                    v{sub.version}
                  </span>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-3">
                  {sub.moderatorReview ? (
                    <span className={`inline-block text-[8px] sm:text-xs font-bold py-1 px-2 rounded border ${sub.moderatorReview.status === 'PASS' ? 'text-(--accent-green) border-[rgba(0,230,118,0.3)] bg-[rgba(0,230,118,0.1)]' : 'text-[#ff6275] border-[rgba(255,98,117,0.3)] bg-[rgba(255,98,117,0.1)]'}`}>
                      ■ {sub.moderatorReview.status}
                    </span>
                  ) : (
                    <span className="inline-block text-[8px] sm:text-xs font-bold py-1 px-2 rounded border text-[rgba(255,167,38,1)] border-[rgba(255,167,38,0.3)] bg-[rgba(255,167,38,0.1)] text-center w-full max-w-[80px]">
                      PENDING
                    </span>
                  )}
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-3">
                  <div className="flex flex-wrap gap-1">
                    {sub.moderatorReview?.tags?.map((tag, idx) => (
                      <span key={idx} className="inline-block text-[9px] font-bold py-0.5 px-1.5 rounded bg-(--bg-base) border border-(--border-subtle) text-(--text-secondary)">
                        {tag}
                      </span>
                    ))}
                    {(!sub.moderatorReview?.tags || sub.moderatorReview.tags.length === 0) && (
                      <span className="text-(--text-muted) opacity-20">—</span>
                    )}
                  </div>
                </td>
                <td className="py-3 sm:py-4 px-2 sm:px-3">
                  {sub.moderatorReview?.note ? (
                    <div className="text-[10px] sm:text-xs text-(--text-secondary) italic whitespace-pre-wrap leading-relaxed">
                      &quot;{sub.moderatorReview.note}&quot;
                    </div>
                  ) : (
                    <span className="text-(--text-muted) opacity-20">—</span>
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
                    <button 
                      onClick={() => setReviewTarget({ submission: sub, status: 'PASS' })} 
                      className={`p-1 sm:p-1.5 border rounded transition ${sub.moderatorReview?.status === 'PASS' ? 'bg-(--accent-green) border-(--accent-green) text-black' : 'bg-[rgba(0,230,118,0.1)] border-(--accent-green) text-(--accent-green) hover:bg-(--accent-green) hover:text-black'}`} 
                      title={sub.moderatorReview?.status === 'PASS' ? 'Update Tags/Note' : 'Approve Submission'}
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={() => setReviewTarget({ submission: sub, status: 'DISQUALIFIED' })} 
                      className={`p-1 sm:p-1.5 border rounded transition ${sub.moderatorReview?.status === 'DISQUALIFIED' ? 'bg-[#ff6275] border-[#ff6275] text-white' : 'bg-[rgba(255,98,117,0.1)] border-[#ff6275] text-[#ff6275] hover:bg-[#ff6275] hover:text-white'}`} 
                      title={sub.moderatorReview?.status === 'DISQUALIFIED' ? 'Update Tags/Note' : 'Disqualify Submission'}
                    >
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
        <div className="mt-4 flex flex-col gap-2 border-t border-(--border-subtle) pt-3 text-[11px] text-(--text-muted) sm:flex-row sm:items-center sm:justify-between">
          <div>
            Page {submissionsPage} of {totalSubmissionsPages} · Showing {submissions.length} / {total} matching submissions
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubmissionsPage((p) => Math.max(1, p - 1))}
              disabled={submissionsPage <= 1 || loading}
              className="rounded border border-(--border-subtle) px-2 py-1 text-[11px] text-(--text-secondary) disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setSubmissionsPage((p) => Math.min(totalSubmissionsPages, p + 1))}
              disabled={submissionsPage >= totalSubmissionsPages || loading}
              className="rounded border border-(--border-subtle) px-2 py-1 text-[11px] text-(--text-secondary) disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {reviewTarget && (
        <ReviewModal
          submission={reviewTarget.submission}
          status={reviewTarget.status}
          onConfirm={(note, tags) => submitReview(reviewTarget.submission.id, reviewTarget.status, note, tags)}
          onCancel={() => setReviewTarget(null)}
        />
      )}

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