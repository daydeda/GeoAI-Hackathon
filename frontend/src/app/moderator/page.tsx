'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Check, X, RefreshCw } from 'lucide-react'
import CustomDropdown from '@/components/CustomDropdown'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Team { name: string; track: string }
interface File { fileKey: string; originalName: string }
interface Review { status: 'PASS' | 'DISQUALIFIED' }
interface Submission { id: string; submittedAt: string; team: Team; files: File[]; moderatorReview: Review | null }

const TRACK_LABELS: Record<string, string> = {
  SMART_AGRICULTURE: 'Smart Agriculture',
  DISASTER_FLOOD_RESPONSE: 'Disaster & Flood Response',
}

function formatTrackLabel(track: string) {
  return TRACK_LABELS[track] || track.replace(/_/g, ' ')
}

function ModeratorContent() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [trackFilter, setTrackFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [announcementOpen, setAnnouncementOpen] = useState(false)
  const [sendingAnnouncementId, setSendingAnnouncementId] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ limit: '50' })
      if (trackFilter) qs.set('track', trackFilter)
      if (statusFilter) qs.set('status', statusFilter)
      
      const res = await fetch(`${API}/api/v1/mod/submissions?${qs.toString()}`, { credentials: 'include' })
      if (res.ok) {
        const d = await res.json()
        setSubmissions(d.data || [])
        setTotal(d.total || 0)
        setAnnouncementOpen(Boolean(d.announcementOpen))
      }
    } finally {
      setLoading(false)
    }
  }, [trackFilter, statusFilter])

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

  const sendAnnouncement = async (submissionId: string) => {
    setSendingAnnouncementId(submissionId)
    try {
      const res = await fetch(`${API}/api/v1/mod/submissions/${submissionId}/announcement`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to send announcement')
      const recipients = Array.isArray(data.recipients) ? data.recipients.length : 0
      window.alert(`Announcement sent to ${recipients} competitor(s).`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to send announcement')
    } finally {
      setSendingAnnouncementId(null)
    }
  }

  const canSendAnnouncements = Boolean(announcementOpen && user?.roles?.some((r) => r === 'ADMIN' || r === 'MODERATOR'))

  return (
    <div className="flex flex-col min-h-screen bg-(--bg-base)">
      {/* Header */}
      <div className="border-b border-(--border-subtle) bg-(--bg-surface) px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl text-white font-bold">Content Moderation</h1>
            <p className="text-xs sm:text-sm text-(--text-secondary) mt-1 sm:mt-2">Review and approve submissions</p>
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
            { label: 'PENDING', value: submissions.filter(s => !s.moderatorReview).length, color: 'text-(--accent-amber)' },
            { label: 'APPROVED', value: submissions.filter(s => s.moderatorReview?.status === 'PASS').length, color: 'text-(--accent-green)' },
            { label: 'DISQUALIFIED', value: submissions.filter(s => s.moderatorReview?.status === 'DISQUALIFIED').length, color: 'text-[#ff6275]' },
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
              onChange={setTrackFilter}
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
      <div className="flex-1 overflow-x-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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
            {submissions.map(sub => (
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
                  {sub.moderatorReview && canSendAnnouncements && (
                    <button
                      onClick={() => sendAnnouncement(sub.id)}
                      disabled={sendingAnnouncementId === sub.id}
                      className="ml-2 px-2 sm:px-3 py-1 text-[10px] sm:text-xs border border-(--accent-cyan) text-(--accent-cyan) rounded hover:bg-[rgba(0,229,255,0.1)] disabled:opacity-50"
                    >
                      {sendingAnnouncementId === sub.id ? 'Sending...' : 'Send Announcement'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
