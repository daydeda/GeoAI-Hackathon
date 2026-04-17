'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import Link from 'next/link'
import {
  Mail,
  Users,
  Send,
  RefreshCw,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface RecipientPreview {
  id: string
  email: string
  fullName: string
  competitorStatus: string
}

type StatusFilter = 'VERIFIED_COMPETITOR' | 'INCORRECT_COMPETITOR' | 'DISQUALIFIED' | 'QUALIFIED' | 'PENDING'

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string; color: string; description: string }> = [
  {
    value: 'VERIFIED_COMPETITOR',
    label: 'Verified',
    color: 'var(--accent-green)',
    description: 'Moderator-approved competitors',
  },
  {
    value: 'INCORRECT_COMPETITOR',
    label: 'Incorrect Info',
    color: '#ff6275',
    description: 'Rejected by moderator',
  },
  {
    value: 'DISQUALIFIED',
    label: 'Disqualified',
    color: '#ff6275',
    description: 'Rejected submissions or eliminated teams',
  },
  {
    value: 'QUALIFIED',
    label: 'Qualified',
    color: 'var(--accent-cyan)',
    description: 'Finalists',
  },
  {
    value: 'PENDING',
    label: 'Pending',
    color: 'var(--accent-amber)',
    description: 'Not yet reviewed',
  },
]

function BulkEmailContent() {
  const { hasRole } = useAuth()

  // Filters
  const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])

  // Recipients
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [loadingRecipients, setLoadingRecipients] = useState(false)

  // Compose
  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [showPreviewPane, setShowPreviewPane] = useState(true)

  // Send
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendResult, setSendResult] = useState<{ 
    sent: number; 
    failed: number; 
    message: string;
    failures?: Array<{ email: string; reason: string }>;
  } | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canAccess = hasRole('ADMIN') || hasRole('MODERATOR')

  // Fetch teams for the team selector
  useEffect(() => {
    fetch(`${API}/api/v1/admin/teams?limit=200`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setTeams((d.data || []).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))))
      .catch(() => {})
  }, [])

  const fetchRecipients = useCallback(async () => {
    if (selectedStatuses.length === 0 && !selectedTeamId) {
      setRecipientCount(null)
      setRecipientPreview([])
      return
    }
    setLoadingRecipients(true)
    try {
      const params = new URLSearchParams()
      if (selectedStatuses.length > 0) params.set('statuses', selectedStatuses.join(','))
      if (selectedTeamId) params.set('teamId', selectedTeamId)
      const res = await fetch(`${API}/api/v1/admin/bulk-email/recipients?${params.toString()}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const d = await res.json()
        setRecipientCount(d.total)
        setRecipientPreview(d.recipients || [])
      }
    } finally {
      setLoadingRecipients(false)
    }
  }, [selectedStatuses, selectedTeamId])

  // Debounced recipient refresh on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { fetchRecipients() }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [fetchRecipients])

  const toggleStatus = (status: StatusFilter) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }

  const handleSend = async () => {
    if (!subject.trim() || !htmlBody.trim()) return
    setSending(true)
    setConfirmOpen(false)
    setSendResult(null)
    try {
      const res = await fetch(`${API}/api/v1/admin/bulk-email/send`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          htmlBody: htmlBody.trim(),
          filters: {
            statuses: selectedStatuses,
            teamId: selectedTeamId || undefined,
          },
        }),
      })
      const d = await res.json().catch(() => ({})) as { message?: string; sent?: number; failed?: number; error?: string; failures?: Array<{ email: string; reason: string }> }
      if (res.ok) {
        setSendResult({
          sent: d.sent ?? 0,
          failed: d.failed ?? 0,
          message: d.message || 'Done',
          failures: d.failures,
        })
        if (d.failed === 0) {
          setSubject('')
          setHtmlBody('')
        }
        // Refresh recipients to reflect any changes
        fetchRecipients()
      } else {
        setSendResult({ sent: 0, failed: 1, message: d.error || 'Failed to send bulk email', failures: [] })
      }
    } catch {
      setSendResult({ sent: 0, failed: 1, message: 'Network error. Please try again.', failures: [] })
    } finally {
      setSending(false)
    }
  }

  const canSend = subject.trim().length > 0 && htmlBody.trim().length > 0 && (selectedStatuses.length > 0 || selectedTeamId) && !sending

  if (!canAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center text-(--text-muted)">
          <Mail size={40} className="mx-auto mb-4 opacity-30" />
          <p>Access restricted to Admins and Moderators.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-(--text-muted) no-underline hover:text-(--text-secondary) transition"
        >
          <ChevronLeft size={13} />
          Back to Admin
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-mono mb-1 flex items-center gap-2 text-[11px] tracking-[0.1em] text-(--accent-cyan)">
              <Mail size={12} />
              <span>BULK EMAIL DISPATCH</span>
            </div>
            <h1 className="font-display text-3xl text-white sm:text-4xl">Email Dispatch</h1>
            <p className="mt-1 text-sm text-(--text-secondary)">
              Compose and send targeted emails to filtered competitor groups.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* ── LEFT: Filters + Recipient Counter ─────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Status Filters */}
          <div className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold tracking-[0.08em] text-(--text-muted)">
                RECIPIENT FILTERS
              </div>
              <button
                onClick={() => {
                  if (selectedStatuses.length === STATUS_OPTIONS.length) setSelectedStatuses([])
                  else setSelectedStatuses(STATUS_OPTIONS.map(o => o.value))
                }}
                className="text-[10px] font-bold text-(--accent-cyan) hover:underline"
              >
                {selectedStatuses.length === STATUS_OPTIONS.length ? 'CLEAR ALL' : 'SELECT ALL'}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const checked = selectedStatuses.includes(opt.value)
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition ${
                      checked
                        ? 'border-opacity-60 bg-[rgba(255,255,255,0.04)]'
                        : 'border-(--border-subtle) hover:border-white/10'
                    }`}
                    style={{ borderColor: checked ? opt.color : undefined }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStatus(opt.value)}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition`}
                      style={{
                        borderColor: checked ? opt.color : 'var(--border-subtle)',
                        background: checked ? opt.color : 'transparent',
                        color: checked ? '#000' : 'transparent',
                      }}
                    >
                      ✓
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: checked ? opt.color : 'var(--text-secondary)' }}>
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-(--text-muted)">{opt.description}</div>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Team selector */}
            <div className="mt-4">
              <div className="mb-1.5 text-xs font-semibold tracking-[0.06em] text-(--text-muted)">
                TARGET TEAM (OPTIONAL)
              </div>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-sm text-white outline-none"
              >
                <option value="">— All teams —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-(--text-muted)">
                When a team is selected, only its members matching the status filters above are targeted.
                You may use this without status filters to target an entire team.
              </p>
            </div>
          </div>

          {/* Recipient Counter */}
          <div className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold tracking-[0.08em] text-(--text-muted)">RECIPIENTS</div>
              <button
                onClick={fetchRecipients}
                disabled={loadingRecipients}
                className="p-1.5 rounded border border-(--border-subtle) text-(--text-muted) hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw size={13} className={loadingRecipients ? 'animate-spin' : ''} />
              </button>
            </div>

            {recipientCount === null ? (
              <div className="mt-4 text-sm text-(--text-muted)">
                Select at least one filter to preview recipients.
              </div>
            ) : (
              <>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold text-white">{recipientCount}</span>
                  <span className="text-sm text-(--text-muted)">recipients</span>
                  {loadingRecipients && <RefreshCw size={14} className="animate-spin text-(--text-muted)" />}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-(--text-muted)">
                  <Users size={11} />
                  Emails will be sent to registered Gmail addresses.
                </div>
                <button
                  onClick={() => setShowPreview((p) => !p)}
                  className="mt-3 flex items-center gap-1.5 text-[11px] text-(--accent-cyan) hover:underline"
                >
                  {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showPreview ? 'Hide' : 'Show'} recipient list
                </button>
                {showPreview && recipientPreview.length > 0 && (
                  <div className="mt-3 max-h-48 overflow-y-auto rounded border border-(--border-subtle) bg-(--bg-base)">
                    {recipientPreview.map((r) => (
                      <div key={r.id} className="flex items-center justify-between border-b border-white/[0.03] px-3 py-2 last:border-0">
                        <div>
                          <div className="text-xs text-white">{r.fullName}</div>
                          <div className="text-[10px] text-(--text-muted)">{r.email}</div>
                        </div>
                        <div className="text-[9px] font-semibold uppercase tracking-wide" style={{
                          color: STATUS_OPTIONS.find(s => s.value === r.competitorStatus)?.color ?? 'var(--text-muted)',
                        }}>
                          {r.competitorStatus?.replace(/_/g, ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Composer ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5">
            <div className="mb-3 text-xs font-semibold tracking-[0.08em] text-(--text-muted)">COMPOSE EMAIL</div>

            {/* Subject */}
            <label className="mb-1 block text-xs text-(--text-muted)">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Important Update from GeoAI Hackathon Team"
              className="mb-4 w-full rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
            />

            {/* Body + Preview split */}
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs text-(--text-muted)">Body (HTML) *</label>
              <button
                type="button"
                onClick={() => setShowPreviewPane((p) => !p)}
                className="flex items-center gap-1 text-[11px] text-(--accent-cyan) hover:underline"
              >
                {showPreviewPane ? <EyeOff size={11} /> : <Eye size={11} />}
                {showPreviewPane ? 'Hide preview' : 'Show preview'}
              </button>
            </div>

            <div className={`grid gap-3 ${showPreviewPane ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* HTML textarea */}
              <div>
                <div className="mb-1 flex items-center gap-1">
                  <span className="rounded bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 text-[9px] font-mono text-(--text-muted)">HTML</span>
                </div>
                <textarea
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  placeholder={`<p>Dear {{name}},</p>\n<p>Your message here...</p>\n\n<p>Use {{name}} for recipient name, {{email}} for their email.</p>`}
                  className="w-full rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-white/20"
                  style={{ minHeight: 320, resize: 'vertical' }}
                />
                <p className="mt-1 text-[11px] text-(--text-muted)">
                  Use <code className="text-(--accent-cyan)">{"{{name}}"}</code> and <code className="text-(--accent-cyan)">{"{{email}}"}</code> as personalization placeholders.
                </p>
              </div>

              {/* Live HTML preview */}
              {showPreviewPane && (
                <div>
                  <div className="mb-1 flex items-center gap-1">
                    <span className="rounded bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 text-[9px] font-mono text-(--text-muted)">PREVIEW</span>
                  </div>
                  <div
                    className="w-full rounded border border-(--border-subtle) bg-white p-4 text-sm text-gray-800"
                    style={{ minHeight: 320, overflowY: 'auto' }}
                    dangerouslySetInnerHTML={{
                      __html: htmlBody
                        .replace(/\{\{name\}\}/gi, '<strong>[Recipient Name]</strong>')
                        .replace(/\{\{email\}\}/gi, '<em>recipient@email.com</em>') || '<span style="color:#aaa">HTML preview will appear here…</span>',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Send result */}
            {sendResult && (
              <div className={`mt-4 flex items-start gap-3 rounded border p-4 ${
                sendResult.failed > 0
                  ? 'border-[rgba(255,167,38,0.4)] bg-[rgba(255,167,38,0.07)]'
                  : 'border-[rgba(0,230,118,0.3)] bg-[rgba(0,230,118,0.07)]'
              }`}>
                {sendResult.failed > 0
                  ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-(--accent-amber)" />
                  : <CheckCircle size={16} className="mt-0.5 shrink-0 text-(--accent-green)" />
                }
                <div>
                  <div className="text-xs font-semibold text-white">{sendResult.message}</div>
                  <div className="mt-0.5 text-[11px] text-(--text-muted)">
                    Sent: {sendResult.sent} · Failed: {sendResult.failed}
                  </div>
                  {sendResult.failures && sendResult.failures.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto rounded bg-black/20 p-2 text-[10px] text-(--accent-amber)">
                      <div className="mb-1 font-bold">Failure Reasons:</div>
                      {sendResult.failures.slice(0, 10).map((f: { email: string; reason: string }, i: number) => (
                        <div key={i}>• {f.email}: {f.reason}</div>
                      ))}
                      {sendResult.failures.length > 10 && <div>...and {sendResult.failures.length - 10} more</div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Send button */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={!canSend}
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 rounded bg-(--accent-cyan) px-6 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={15} />
                {sending ? 'Sending…' : `Send to ${recipientCount ?? '?'} Recipients`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-(--bg-surface) p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
            <div className="mb-1 flex items-center gap-2">
              <Send size={16} className="text-(--accent-cyan)" />
              <h2 className="text-base font-bold tracking-[0.05em] text-white">CONFIRM BULK SEND</h2>
            </div>
            <p className="my-4 text-sm text-(--text-secondary)">
              You are about to send the email <strong className="text-white">&quot;{subject}&quot;</strong> to{' '}
              <strong className="text-white">{recipientCount}</strong> recipient(s).<br /><br />
              Emails will be delivered to their registered Gmail addresses. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded border border-(--border-subtle) bg-transparent px-5 py-2 text-xs font-semibold text-(--text-muted)"
              >
                CANCEL
              </button>
              <button
                onClick={handleSend}
                className="inline-flex items-center gap-1.5 rounded bg-(--accent-cyan) px-5 py-2 text-xs font-bold text-black"
              >
                <Send size={12} />
                SEND NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BulkEmailPage() {
  return (
    <AuthProvider>
      <AppShell>
        <BulkEmailContent />
      </AppShell>
    </AuthProvider>
  )
}
