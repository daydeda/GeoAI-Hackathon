'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Check, X, RefreshCw, Eye, FileText, AlertCircle, Search, ShieldCheck, User, Trash2 } from 'lucide-react'
import CustomDropdown from '@/components/CustomDropdown'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Competitor {
  id: string
  email: string
  fullName: string
  competitorStatus: string
  moderatorNote?: string | null
  idCardFileKey?: string | null
  university?: string | null
  yearOfStudy?: number | null
  phoneNumber?: string | null
  address?: string | null
  experience?: string | null
  createdAt: string
}

// ── Rejection Reason Modal ───────────────────────────────────────────────────
function RejectionModal({
  userName,
  onConfirm,
  onCancel,
}: {
  userName: string
  onConfirm: (note: string) => void
  onCancel: () => void
}) {
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)
  const invalid = touched && note.trim().length === 0

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-[rgba(255,98,117,0.4)] bg-(--bg-surface) p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
        <div className="mb-1 flex items-center gap-2">
          <AlertCircle size={16} className="text-[#ff6275]" />
          <h2 className="text-base font-bold tracking-[0.05em] text-white">REJECTION REASON REQUIRED</h2>
        </div>
        <p className="mb-4 text-sm text-(--text-secondary)">
          You are about to mark <strong className="text-white">{userName}</strong> as having incorrect information.
          Please provide a mandatory reason — this will be shown to the competitor.
        </p>
        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Describe why this profile is being rejected (e.g., ID card blurry, name mismatch)…"
          className={`min-h-[100px] w-full rounded border bg-(--bg-base) px-3 py-2 text-sm text-white outline-none transition ${
            invalid ? 'border-[#ff6275]' : 'border-(--border-subtle)'
          }`}
        />
        {invalid && (
          <p className="mt-1 text-xs text-[#ff6275]">A reason is required to proceed with rejection.</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded border border-(--border-subtle) bg-transparent px-5 py-2 text-xs font-semibold text-(--text-muted)"
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              setTouched(true)
              if (note.trim().length > 0) onConfirm(note.trim())
            }}
            className="rounded border-none bg-[#ff6275] px-5 py-2 text-xs font-bold text-white"
          >
            CONFIRM REJECT
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({
  userName,
  onConfirm,
  onCancel,
}: {
  userName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-[rgba(255,98,117,0.4)] bg-(--bg-surface) p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
        <div className="mb-2 flex items-center gap-2 text-[#ff6275]">
          <AlertCircle size={20} />
          <h2 className="text-lg font-bold tracking-tight text-white uppercase">Confirm Account Deletion</h2>
        </div>
        <p className="mb-6 text-sm text-(--text-secondary) leading-relaxed">
          You are about to <strong className="text-[#ff6275]">permanently delete</strong> the account for <strong className="text-white">{userName}</strong>. 
          This action cannot be undone and will remove all associated data for this user.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="flex-1 sm:flex-none rounded border border-(--border-subtle) bg-transparent px-5 py-2.5 text-xs font-semibold text-(--text-muted) hover:bg-(--bg-base) transition"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 sm:flex-none rounded border-none bg-[#ff6275] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#ff3b53] transition shadow-[0_4px_12px_rgba(255,98,117,0.3)]"
          >
            DELETE PERMANENTLY
          </button>
        </div>
      </div>
    </div>
  )
}

function ModeratorVerifyContent() {
  const [users, setUsers] = useState<Competitor[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [rejectionTarget, setRejectionTarget] = useState<Competitor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Competitor | null>(null)
  const [previewUserId, setPreviewUserId] = useState<string | null>(null)

  const LIMIT = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        status: statusFilter || 'ALL',
        search,
      })
      const res = await fetch(`${API}/api/v1/mod/users?${qs.toString()}`, { credentials: 'include' })
      if (res.ok) {
        const d = await res.json()
        setUsers(d.data || [])
        setTotal(d.total || 0)
      }
    } catch (e) {
      console.error('Fetch users error:', e)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => {
    fetchUsers()

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUsers()
      }
    }, 8000)

    const onFocus = () => fetchUsers()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchUsers()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [fetchUsers])

  const handleVerify = async (userId: string, isApprove: boolean, note?: string) => {
    try {
      const status = isApprove ? 'VERIFIED_COMPETITOR' : 'INCORRECT_COMPETITOR'
      const res = await fetch(`${API}/api/v1/mod/users/${userId}/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      })
      if (res.ok) {
        fetchUsers()
      } else {
        const d = await res.json().catch(() => ({}))
        alert(d.error || 'Verification failed')
      }
    } catch (e) {
      console.error('Verification error:', e)
    }
  }

  const handleRejectionConfirm = async (note: string) => {
    if (!rejectionTarget) return
    const uid = rejectionTarget.id
    setRejectionTarget(null)
    await handleVerify(uid, false, note)
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`${API}/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        fetchUsers()
        setDeleteTarget(null)
      } else {
        const d = await res.json()
        alert(d.error || 'Deletion failed')
      }
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      PENDING: { label: 'PENDING', color: 'text-(--accent-amber)', bg: 'bg-[rgba(255,167,38,0.1)]' },
      VERIFIED_COMPETITOR: { label: 'VERIFIED', color: 'text-(--accent-green)', bg: 'bg-[rgba(0,230,118,0.1)]' },
      INCORRECT_COMPETITOR: { label: 'INCORRECT', color: 'text-[#ff6275]', bg: 'bg-[rgba(255,98,117,0.1)]' },
      QUALIFIED: { label: 'QUALIFIED', color: 'text-(--accent-cyan)', bg: 'bg-[rgba(0,229,255,0.1)]' },
      DISQUALIFIED: { label: 'DISQUALIFIED', color: 'text-[#ff6275]', bg: 'bg-[rgba(255,98,117,0.1)]' },
    }
    const s = map[status] || map.PENDING
    return (
      <span className={`inline-block text-[8px] sm:text-[10px] font-bold py-1 px-2 rounded border ${s.color} border-current ${s.bg}`}>
        {s.label}
      </span>
    )
  }

  const previewUrl = previewUserId ? `${API}/api/v1/admin/users/${previewUserId}/uploads/id-card/view` : ''

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-(--bg-base)">
      {/* Rejection Modal */}
      {rejectionTarget && (
        <RejectionModal
          userName={rejectionTarget.fullName}
          onConfirm={handleRejectionConfirm}
          onCancel={() => setRejectionTarget(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          userName={deleteTarget.fullName}
          onConfirm={() => handleDeleteUser(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div className="border-b border-(--border-subtle) bg-(--bg-surface) px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={20} className="text-(--accent-cyan)" />
              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl text-white font-bold uppercase tracking-tight">Moderator Review</h1>
            </div>
            <p className="text-xs sm:text-sm text-(--text-secondary)">Verify competitor identities and Student ID documents.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            {loading && <RefreshCw size={14} className="animate-spin text-(--text-muted)" />}
            <span className="text-(--text-muted)">Total Competitors: <span className="text-(--accent-cyan) font-semibold">{total}</span></span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="border-b border-(--border-subtle) bg-(--bg-surface) px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) group-focus-within:text-(--accent-cyan) transition-colors" />
              <input
                placeholder="Search name or email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="bg-(--bg-base) border border-(--border-subtle) rounded-md pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-(--text-muted) outline-none w-full sm:w-64 focus:border-(--accent-cyan) transition-all"
              />
            </div>
            <CustomDropdown
              className="min-w-[200px]"
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1) }}
              options={[
                { value: '', label: 'ALL STATUS' },
                { value: 'PENDING', label: 'Pending Review' },
                { value: 'VERIFIED_COMPETITOR', label: 'Verified' },
                { value: 'INCORRECT_COMPETITOR', label: 'Incorrect' },
                { value: 'QUALIFIED', label: 'Qualified (Finalist)' },
                { value: 'DISQUALIFIED', label: 'Disqualified' },
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers()}
              className="flex items-center gap-2 px-3 py-2 bg-(--bg-base) border border-(--border-subtle) rounded text-xs text-white hover:bg-(--bg-elevated) transition"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table & Cards container */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {/* Desktop Table View */}
        <div className="hidden lg:block rounded-lg border border-(--border-subtle) bg-(--bg-surface) overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-(--border-subtle) bg-[rgba(255,255,255,0.02)]">
                <th className="py-4 px-4 text-[10px] text-(--text-muted) font-bold tracking-widest uppercase">Competitor</th>
                <th className="py-4 px-4 text-[10px] text-(--text-muted) font-bold tracking-widest uppercase">Affiliation</th>
                <th className="py-4 px-4 text-[10px] text-(--text-muted) font-bold tracking-widest uppercase">Contact & Background</th>
                <th className="py-4 px-4 text-[10px] text-(--text-muted) font-bold tracking-widest uppercase">Status</th>
                <th className="py-4 px-4 text-[10px] text-(--text-muted) font-bold tracking-widest uppercase">Note</th>
                <th className="py-4 px-4 text-[10px] text-(--text-muted) font-bold tracking-widest uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-(--text-muted) italic">
                    {loading ? 'Scanning database...' : 'No competitors found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-(--border-subtle) hover:bg-[rgba(255,255,255,0.01)] transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[rgba(0,229,255,0.1)] flex items-center justify-center text-(--accent-cyan)">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-(--accent-cyan) transition-colors">{user.fullName}</div>
                          <div className="text-[11px] text-(--text-muted) font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-white font-medium">{user.university || '—'}</div>
                      <div className="text-[11px] text-(--text-muted)">Year {user.yearOfStudy || '—'}</div>
                    </td>
                    <td className="py-4 px-4 max-w-[300px]">
                      {user.phoneNumber && (
                        <div className="text-[11px] text-(--accent-cyan) font-mono mb-1.5 flex items-center gap-1">
                          <Eye size={10} /> {user.phoneNumber}
                        </div>
                      )}
                      {user.address && (
                        <div className="mb-2">
                          <div className="text-[9px] text-(--text-muted) font-bold tracking-wider uppercase mb-0.5">Address</div>
                          <div className="text-[11px] text-white/80 whitespace-pre-wrap leading-tight">{user.address}</div>
                        </div>
                      )}
                      {user.experience && (
                        <div>
                          <div className="text-[9px] text-(--text-muted) font-bold tracking-wider uppercase mb-0.5">Experience</div>
                          <div className="text-[11px] text-white/80 whitespace-pre-wrap leading-tight">{user.experience}</div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {statusBadge(user.competitorStatus)}
                    </td>
                    <td className="py-4 px-4">
                      {user.moderatorNote ? (
                        <div className="max-w-[250px] whitespace-pre-wrap text-[11px] text-[#ff6275] italic leading-relaxed">
                          &quot;{user.moderatorNote}&quot;
                        </div>
                      ) : (
                        <span className="text-(--text-muted) opacity-30">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {user.idCardFileKey ? (
                           <button
                             onClick={() => setPreviewUserId(user.id)}
                             className="p-1.5 bg-[rgba(0,229,255,0.1)] border border-(--accent-cyan) text-(--accent-cyan) rounded hover:bg-(--accent-cyan) hover:text-black transition-all flex items-center gap-1"
                           >
                             <Eye size={14} />
                             <span className="text-[10px] font-bold">VIEW ID</span>
                           </button>
                        ) : (
                           <span className="text-[10px] text-(--text-muted) italic px-2">No ID</span>
                        )}
                        <div className="h-6 w-[1px] bg-(--border-subtle) mx-1"></div>
                        <button
                          disabled={user.competitorStatus === 'VERIFIED_COMPETITOR'}
                          onClick={() => handleVerify(user.id, true)}
                          className={`p-1.5 border rounded transition-all ${user.competitorStatus === 'VERIFIED_COMPETITOR' ? 'opacity-30 bg-transparent border-(--border-subtle) text-(--text-muted)' : 'bg-[rgba(0,230,118,0.1)] border-(--accent-green) text-(--accent-green) hover:bg-(--accent-green) hover:text-black'}`}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          disabled={user.competitorStatus === 'INCORRECT_COMPETITOR'}
                          onClick={() => setRejectionTarget(user)}
                          className={`p-1.5 border rounded transition-all ${user.competitorStatus === 'INCORRECT_COMPETITOR' ? 'opacity-30 bg-transparent border-(--border-subtle) text-(--text-muted)' : 'bg-[rgba(255,98,117,0.1)] border-[#ff6275] text-[#ff6275] hover:bg-[#ff6275] hover:text-white'}`}
                        >
                          <X size={14} />
                        </button>
                        <div className="h-6 w-[1px] bg-(--border-subtle) mx-1"></div>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="p-1.5 border border-[rgba(255,255,255,0.1)] text-(--text-muted) rounded hover:bg-[#ff3b53] hover:border-[#ff3b53] hover:text-white transition-all"
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {users.length === 0 ? (
            <div className="py-12 text-center text-(--text-muted) italic bg-(--bg-surface) rounded-lg border border-(--border-subtle)">
              {loading ? 'Scanning database...' : 'No competitors found.'}
            </div>
          ) : (
            users.map(user => (
              <div key={user.id} className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-4 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[rgba(0,229,255,0.1)] flex items-center justify-center text-(--accent-cyan) shrink-0">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{user.fullName}</div>
                      <div className="text-[11px] text-(--text-muted) font-mono truncate">{user.email}</div>
                    </div>
                  </div>
                  {statusBadge(user.competitorStatus)}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-(--border-subtle) pt-4">
                  <div>
                    <div className="text-[9px] text-(--text-muted) font-bold tracking-wider uppercase mb-0.5">Affiliation</div>
                    <div className="text-xs text-white font-medium">{user.university || '—'}</div>
                    <div className="text-[10px] text-(--text-muted)">Year {user.yearOfStudy || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-(--text-muted) font-bold tracking-wider uppercase mb-0.5">Contact</div>
                    <div className="text-xs text-(--accent-cyan) font-mono">{user.phoneNumber || '—'}</div>
                  </div>
                </div>

                {(user.address || user.experience) && (
                  <div className="space-y-3 border-t border-(--border-subtle) pt-4">
                    {user.address && (
                      <div>
                        <div className="text-[9px] text-(--text-muted) font-bold tracking-wider uppercase mb-0.5">Address</div>
                        <div className="text-[11px] text-white/80 whitespace-pre-wrap leading-tight">{user.address}</div>
                      </div>
                    )}
                    {user.experience && (
                      <div>
                        <div className="text-[9px] text-(--text-muted) font-bold tracking-wider uppercase mb-0.5">Experience</div>
                        <div className="text-[11px] text-white/80 whitespace-pre-wrap leading-tight">{user.experience}</div>
                      </div>
                    )}
                  </div>
                )}

                {user.moderatorNote && (
                  <div className="border-t border-(--border-subtle) pt-4">
                    <div className="text-[9px] text-[#ff6275] font-bold tracking-wider uppercase mb-1">REJECTION NOTE</div>
                    <div className="text-[11px] text-[#ff6275] italic leading-relaxed bg-[rgba(255,98,117,0.05)] p-2 rounded border border-[rgba(255,98,117,0.2)]">
                      &quot;{user.moderatorNote}&quot;
                    </div>
                  </div>
                )}

                <div className="border-t border-(--border-subtle) pt-4 flex items-center justify-between gap-2">
                  {user.idCardFileKey ? (
                    <button
                      onClick={() => setPreviewUserId(user.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[rgba(0,229,255,0.1)] border border-(--accent-cyan) text-(--accent-cyan) rounded text-xs font-bold transition-all"
                    >
                      <Eye size={16} /> VIEW ID
                    </button>
                  ) : (
                    <div className="flex-1 text-center py-2.5 text-[11px] text-(--text-muted) italic bg-(--bg-base) rounded">No ID uploaded</div>
                  )}

                  <div className="flex gap-2">
                    <button
                      disabled={user.competitorStatus === 'VERIFIED_COMPETITOR'}
                      onClick={() => handleVerify(user.id, true)}
                      className={`p-2.5 border rounded transition-all ${user.competitorStatus === 'VERIFIED_COMPETITOR' ? 'opacity-30 bg-transparent border-(--border-subtle) text-(--text-muted)' : 'bg-[rgba(0,230,118,0.1)] border-(--accent-green) text-(--accent-green)'}`}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      disabled={user.competitorStatus === 'INCORRECT_COMPETITOR'}
                      onClick={() => setRejectionTarget(user)}
                      className={`p-2.5 border rounded transition-all ${user.competitorStatus === 'INCORRECT_COMPETITOR' ? 'opacity-30 bg-transparent border-(--border-subtle) text-(--text-muted)' : 'bg-[rgba(255,98,117,0.1)] border-[#ff6275] text-[#ff6275]'}`}
                    >
                      <X size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="p-2.5 border border-[rgba(255,255,255,0.1)] text-(--text-muted) rounded hover:bg-[#ff3b53] hover:border-[#ff3b53] hover:text-white transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > LIMIT && (
           <div className="mt-6 flex items-center justify-between border-t border-(--border-subtle) pt-6">
             <div className="text-xs text-(--text-muted)">
               Showing {users.length} of {total} competitors
             </div>
             <div className="flex items-center gap-2">
               <button
                 disabled={page === 1 || loading}
                 onClick={() => setPage(p => p - 1)}
                 className="px-4 py-2 border border-(--border-subtle) rounded text-xs text-white disabled:opacity-30 hover:bg-(--bg-surface) transition"
               >
                 Previous
               </button>
               <button
                 disabled={page * LIMIT >= total || loading}
                 onClick={() => setPage(p => p + 1)}
                 className="px-4 py-2 border border-(--border-subtle) rounded text-xs text-white disabled:opacity-30 hover:bg-(--bg-surface) transition"
               >
                 Next
               </button>
             </div>
           </div>
        )}
      </div>

      {/* ID Preview Modal */}
      {previewUserId && (
        <div className="fixed inset-0 z-[150] bg-black/90 p-4 sm:p-10 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white">
              <FileText size={18} className="text-(--accent-cyan)" />
              <span className="font-bold tracking-wide uppercase">ID Document Viewer</span>
            </div>
            <button
               onClick={() => setPreviewUserId(null)}
               className="h-10 w-10 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)] text-white hover:bg-(--accent-red) transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 bg-(--bg-base) rounded-lg border border-(--border-subtle) overflow-hidden relative">
            <iframe
              title="ID Card Preview"
              src={previewUrl}
              className="w-full h-full border-none"
            />
          </div>
          <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
             <button
               onClick={() => { handleVerify(previewUserId, true); setPreviewUserId(null); }}
               className="bg-(--accent-green) text-black font-bold px-6 py-3 rounded-full hover:scale-105 transition-transform text-xs sm:text-sm"
             >
               VERIFY & CLOSE
             </button>
             <button
               onClick={() => {
                 const u = users.find(x => x.id === previewUserId);
                 if (u) setRejectionTarget(u);
                 setPreviewUserId(null);
               }}
               className="bg-[#ff6275] text-white font-bold px-6 py-3 rounded-full hover:scale-105 transition-transform text-xs sm:text-sm"
             >
               REJECT & CLOSE
             </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ModeratorVerifyPage() {
  return (
    <AuthProvider>
      <AppShell>
        <ModeratorVerifyContent />
      </AppShell>
    </AuthProvider>
  )
}
