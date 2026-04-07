'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  Check,
  CheckCircle2,
  Circle,
  ClipboardCopy,
  Copy,
  Download,
  FileText,
  Leaf,
  Play,
  Upload,
  Waves,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAlert } from '@/contexts/AlertContext'
import { formatPhaseDeadline } from '@/lib/phaseDeadline'
import { useCompetitionPhases } from '@/hooks/useCompetitionPhases'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function useCountdown(target: string) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0 })
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [target])
  return t
}

function DashboardContent() {
  const { user, loading } = useAuth()
  const { currentPhase } = useCompetitionPhases()
  const [teamData, setTeamData] = useState<Record<string, unknown> | null>(null)
  const [copied, setCopied] = useState(false)
  const { showAlert } = useAlert()
  const { d, h, m, s } = useCountdown(currentPhase.date)
  const phaseDeadline = formatPhaseDeadline(currentPhase.date)

  const fetchTeam = () => {
    fetch(`${API}/api/v1/teams/my`, { credentials: 'include' })
      .then(r => r.json()).then(setTeamData).catch(() => null)
  }

  useEffect(() => {
    if (!user?.team) return
    fetchTeam()
  }, [user])

  const generateInvite = async () => {
    if (!teamData?.id) return
    const res = await fetch(`${API}/api/v1/teams/${teamData.id}/invites`, {
      method: 'POST', credentials: 'include'
    })
    if (res.ok) fetchTeam()
    else {
      const d = await res.json()
      showAlert(d.error || 'Failed to generate invite code', 'error')
    }
  }

  const downloadPermissionLetter = async () => {
    if (!teamData?.id) return
    const res = await fetch(`${API}/api/v1/teams/${teamData.id}/documents/permission-letter`, { credentials: 'include' })
    if (res.ok) {
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PermissionLetter_${teamData.name || 'Team'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      const d = await res.json().catch(() => ({ error: 'Permission letter not yet available or failed to generate.' }))
      showAlert(d.error || 'Permission letter service currently unavailable.', 'warning')
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="font-mono text-sm text-(--accent-cyan)">INITIALIZING TERMINAL...</div>
    </div>
  )

  const team = teamData as { id?: string; name?: string; institution?: string; track?: string; members?: unknown[]; inviteCode?: string; memberCount?: number; maxMembers?: number; status?: string } | null
  const members = (team?.members as Array<{ fullName?: string; isLeader?: boolean; email?: string }>) ?? []
  const submissionStatus = (teamData as { activeSubmission?: unknown } | null)?.activeSubmission
  const hasTeam = !!team

  const steps = [
    { label: 'TEAM CREATED', done: hasTeam },
    { label: 'TRACK SELECTED', done: hasTeam && !!team?.track },
    { label: 'PDF UPLOAD', done: !!submissionStatus },
    { label: 'REVIEW PHASE', done: false },
  ]

  const tracks: { id: string; label: string; icon: LucideIcon }[] = [
    { id: 'SMART_AGRICULTURE', label: 'Smart Agriculture', icon: Leaf },
    { id: 'DISASTER_FLOOD_RESPONSE', label: 'Disaster & Flood Response', icon: Waves },
  ]

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-display mb-1 text-2xl tracking-[0.06em] sm:text-3xl lg:text-4xl">
            COMPETITOR DASHBOARD
          </h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="h-2 w-2 rounded-full bg-(--accent-green)" style={{ animation: 'pulse-green 2s infinite' }} />
            <span className="font-mono text-[11px] text-(--accent-cyan)">OPERATIONAL STATUS: ACTIVE</span>
            <span className="font-mono text-[11px] text-(--text-muted)">LAT: 13.7563 N / LONG: 100.5018 E</span>
          </div>
        </div>
        <div className="text-left lg:text-right">
          <div className="inline-block rounded-lg border border-(--accent-cyan) bg-[rgba(0,229,255,0.08)] px-4 py-3 shadow-[0_0_18px_rgba(0,229,255,0.25)]">
            <div className="mb-1 inline-flex items-center gap-2 rounded border border-(--accent-cyan) bg-[rgba(0,229,255,0.12)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-(--accent-cyan)">
              <span className="h-1.5 w-1.5 rounded-full bg-(--accent-cyan)" style={{ animation: 'pulse-cyan 2s infinite' }} />
              YOU ARE HERE
            </div>
            <div className="font-mono mb-1 text-[10px] text-(--text-muted)">CURRENT PHASE</div>
            <div className="font-display mb-2 text-lg font-bold tracking-[0.05em] text-(--accent-cyan) sm:text-xl">
              {currentPhase.title}
            </div>
            <div className="font-mono mb-1 text-[10px] text-(--text-muted)">PHASE DEADLINE: {phaseDeadline}</div>
            <div className="font-mono mb-1 text-[10px] text-(--text-muted)">TIME TO DEADLINE</div>
            <div className="font-display text-2xl font-bold tracking-[0.05em] text-(--accent-red) sm:text-3xl">
              {String(d).padStart(2,'0')} : {String(h).padStart(2,'0')} : {String(m).padStart(2,'0')} : {String(s).padStart(2,'0')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {/* Team Unit Card */}
          <div className="card p-5">
            <div className="font-mono mb-3 text-[10px] text-(--text-muted)">TEAM UNIT</div>
            <h2 className="font-display mb-4 text-xl sm:text-2xl">
              {team?.name ?? 'No Team Yet'}
            </h2>

            {hasTeam ? (
              <>
                <div className="font-mono mb-2 text-[10px] text-(--text-muted)">INVITE ACCESS CODE</div>
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="font-mono block flex-1 overflow-x-auto rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-xs text-(--accent-cyan)">
                    {team?.inviteCode ?? 'Code required'}
                  </code>
                  {team?.inviteCode ? (
                    <button 
                      className={`btn ${copied ? 'btn-primary' : 'btn-outline'}`} 
                      style={{ padding: '8px 10px', fontSize: 11 }}
                      onClick={() => {
                        navigator.clipboard.writeText(team.inviteCode || '')
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                    >
                      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                      <span>{copied ? 'COPIED' : 'COPY'}</span>
                    </button>
                  ) : (
                    <button className="btn btn-primary" style={{ padding: '8px 10px', fontSize: 11 }} onClick={generateInvite}>
                      <ClipboardCopy size={14} aria-hidden="true" />
                      <span>GENERATE</span>
                    </button>
                  )}
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-mono text-[10px] text-(--text-muted)">MEMBER DEPLOYMENT</div>
                  <div className="font-display text-xl text-(--accent-cyan)">
                    {team?.memberCount ?? members.length} / {team?.maxMembers ?? 4}
                  </div>
                </div>

                {team?.status === 'FINALIST' && (
                  <div className="mb-4 rounded-lg border border-(--accent-green) bg-[rgba(0,230,118,0.05)] p-4">
                    <div className="font-mono mb-2 text-[10px] tracking-[0.05em] text-(--accent-green)">ONSITE ROUND QUALIFIED</div>
                    <p className="mb-3 text-xs leading-relaxed text-(--text-secondary)">
                      Congratulations! Your team has advanced to the Finalist round. Please download the auto-generated Permission/Leave letter below.
                    </p>
                    <button 
                      onClick={downloadPermissionLetter}
                      className="btn w-full justify-center"
                      style={{ background: 'var(--accent-green)', color: 'black', fontSize: 12 }}
                    >
                      <Download size={16} aria-hidden="true" />
                      <span>DOWNLOAD THE PERMISSION LETTER</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link href="/team" className="btn btn-primary mb-3 block text-center no-underline">
                Create Team
              </Link>
            )}

            {/* Member list */}
            <div className="font-mono mb-2 text-[10px] text-(--text-muted)">CREW MANIFEST</div>
            <div className="flex flex-col gap-2">
              {members.length > 0 ? members.map((m, i) => (
                <div key={i} className="flex items-center justify-between border-b border-(--border-subtle) py-2">
                  <div>
                    <div className="text-sm font-semibold">{m.fullName}</div>
                    <div className="text-[10px] tracking-[0.06em]" style={{ color: m.isLeader ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {m.isLeader ? 'LEADER' : 'MEMBER'}
                    </div>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-(--accent-green)" />
                </div>
              )) : (
                <div className="py-3 text-center text-xs text-(--text-muted)">
                  No team members yet
                </div>
              )}
            </div>
          </div>

          {/* Mission Progress */}
          <div className="card p-5">
            <div className="font-mono mb-4 text-[10px] text-(--text-muted)">MISSION PROGRESS</div>
            {steps.map((step, i) => {
              const isActive = !step.done && (i === 0 || steps[i-1].done)
              return (
                <div key={i} className="checklist-step">
                  <div className={`checklist-icon ${step.done ? 'done' : isActive ? 'active' : 'pending'}`}>
                    {step.done && <CheckCircle2 size={14} aria-hidden="true" />}
                    {!step.done && isActive && <Play size={14} aria-hidden="true" />}
                    {!step.done && !isActive && <Circle size={14} aria-hidden="true" />}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', paddingTop: 4, color: step.done ? 'var(--accent-green)' : isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {step.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Competitor Profile */}
          <div className="card p-5">
            <div className="font-mono mb-3 text-[10px] text-(--text-muted)">MY PROFILE</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-(--border-subtle) py-2">
                <span className="text-(--text-muted)">Full Name</span>
                <span className="text-right">{user?.fullName || '-'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-(--border-subtle) py-2">
                <span className="text-(--text-muted)">University</span>
                <span className="text-right">{user?.profile?.university || '-'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-(--border-subtle) py-2">
                <span className="text-(--text-muted)">Year of Study</span>
                <span className="text-right">{user?.profile?.yearOfStudy ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-(--border-subtle) py-2">
                <span className="text-(--text-muted)">Phone</span>
                <span className="text-right">{user?.profile?.phoneNumber || '-'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-(--text-muted)">Student ID File</span>
                <span className="text-right">{user?.profile?.idCardFileUploaded ? 'Uploaded' : 'Missing'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Submission Terminal */}
        <div className="card p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <FileText size={18} className="text-(--accent-cyan)" aria-hidden="true" />
                <h2 className="font-display text-lg tracking-[0.06em] sm:text-xl">SUBMISSION TERMINAL</h2>
              </div>
              <div className="font-mono text-[10px] text-(--accent-cyan)">SECURE UPLINK: 128-BIT ENCRYPTION ACTIVE</div>
            </div>
          </div>

          {/* Track Selection */}
          <div className="font-mono mb-3 text-[10px] text-(--text-muted)">SELECT STRATEGIC TRACK</div>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tracks.map((t) => (
              <div key={t.id} className={`track-card ${team?.track === t.id ? 'selected' : ''}`} style={{ padding: 16 }}>
                <t.icon size={22} className="mb-2 text-(--accent-cyan)" aria-hidden="true" />
                <div className="font-display" style={{ fontSize: 14 }}>{t.label}</div>
              </div>
            ))}
          </div>

          {/* PDF Upload zone */}
          <div className="font-mono mb-3 text-[10px] text-(--text-muted)">TECHNICAL PROPOSAL UPLOAD (PDF)</div>
          <Link href="/submissions" className="no-underline">
            <div className="upload-zone mb-5">
              <Upload size={30} className="mx-auto mb-3 text-(--accent-cyan)" aria-hidden="true" />
              <div className="mb-1 text-sm font-semibold">Drag and drop mission brief</div>
              <div className="text-xs text-(--text-muted)">Max file size: 20MB. Format: PDF only.</div>
            </div>
          </Link>

          {/* GISTDA Declaration */}
          <div className="mb-6 flex gap-3 rounded-lg border border-(--border-subtle) bg-(--bg-base) p-4">
            <div className="mt-0.5 h-4 w-4 shrink-0 rounded-[3px] border-2 border-(--accent-cyan)" />
            <p className="m-0 text-sm leading-relaxed text-(--text-secondary)">
              I declare that this project utilizes{' '}
              <strong style={{ color: 'var(--accent-amber)' }}>Sphere of GISTDA</strong>{' '}
              and adheres to the multispectral processing guidelines established in the hackathon brief. Any data discrepancies must be reported immediately.
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button className="btn btn-outline" style={{ padding: '12px', justifyContent: 'center' }}>SAVE MISSION DRAFT</button>
            <Link href="/submissions" className="btn btn-primary flex items-center justify-center no-underline" style={{ padding: '12px' }}>
              INITIATE SUBMISSION
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
