'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAlert } from '@/contexts/AlertContext'

const API = process.env.NEXT_PUBLIC_API_URL || '/geoai-2026'
const DEADLINE = process.env.NEXT_PUBLIC_SUBMISSION_DEADLINE || '2026-05-01T23:59:59+07:00'

function useCountdown(target: string) {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 })
  useEffect(() => {
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff <= 0) return setT({ h: 0, m: 0, s: 0 })
      setT({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [target])
  return t
}

function DashboardContent() {
  const { user, loading } = useAuth()
  const [teamData, setTeamData] = useState<Record<string, unknown> | null>(null)
  const [copied, setCopied] = useState(false)
  const { showAlert } = useAlert()
  const { h, m, s } = useCountdown(DEADLINE)

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="font-mono" style={{ color: 'var(--accent-cyan)', fontSize: 14 }}>INITIALIZING TERMINAL...</div>
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

  return (
    <div style={{ minHeight: '100vh', padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 36, letterSpacing: '0.06em', marginBottom: 4 }}>
            COMPETITOR DASHBOARD
          </h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse-green 2s infinite' }} />
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>OPERATIONAL STATUS: ACTIVE</span>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>LAT: 13.7563° N / LONG: 100.5018° E</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>TIME TO DEADLINE</div>
          <div className="font-display" style={{ fontSize: 32, color: 'var(--accent-red)', fontWeight: 700, letterSpacing: '0.05em' }}>
            {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Team Unit Card */}
          <div className="card" style={{ padding: 20 }}>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>TEAM UNIT</div>
            <h2 className="font-display" style={{ fontSize: 22, marginBottom: 16 }}>
              {team?.name ?? 'No Team Yet'}
            </h2>

            {hasTeam ? (
              <>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>INVITE ACCESS CODE</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
                  <code className="font-mono" style={{ fontSize: 12, background: 'var(--bg-base)', padding: '8px 12px', borderRadius: 4, border: '1px solid var(--border-subtle)', flex: 1, color: 'var(--accent-cyan)' }}>
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
                      {copied ? '✓ COPIED' : '⧉ COPY'}
                    </button>
                  ) : (
                    <button className="btn btn-primary" style={{ padding: '8px 10px', fontSize: 11 }} onClick={generateInvite}>GENERATE</button>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>MEMBER DEPLOYMENT</div>
                  <div className="font-display" style={{ fontSize: 20, color: 'var(--accent-cyan)' }}>
                    {team?.memberCount ?? members.length} / {team?.maxMembers ?? 4}
                  </div>
                </div>

                {team?.status === 'FINALIST' && (
                  <div style={{ padding: '16px', background: 'rgba(0, 230, 118, 0.05)', border: '1px solid var(--accent-green)', borderRadius: 8, marginBottom: 16 }}>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--accent-green)', marginBottom: 8, letterSpacing: '0.05em' }}>ONSITE ROUND QUALIFIED</div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                      Congratulations! Your team has advanced to the Finalist round. Please download the auto-generated Permission/Leave letter below.
                    </p>
                    <button 
                      onClick={downloadPermissionLetter}
                      className="btn btn-primary" 
                      style={{ width: '100%', background: 'var(--accent-green)', color: 'black', fontSize: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                    >
                      <span style={{ fontSize: 16 }}>⤓</span> DOWNLOAD THE PERMISSION LETTER
                    </button>
                  </div>
                )}
              </>
            ) : (
              <a href="/team" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 12 }}>
                Create Team
              </a>
            )}

            {/* Member list */}
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>CREW MANIFEST</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.length > 0 ? members.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.fullName}</div>
                    <div style={{ fontSize: 10, color: m.isLeader ? 'var(--accent-cyan)' : 'var(--text-muted)', letterSpacing: '0.06em' }}>
                      {m.isLeader ? 'LEADER' : 'MEMBER'}
                    </div>
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
                </div>
              )) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>
                  No team members yet
                </div>
              )}
            </div>
          </div>

          {/* Mission Progress */}
          <div className="card" style={{ padding: 20 }}>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>MISSION PROGRESS</div>
            {steps.map((step, i) => {
              const isActive = !step.done && (i === 0 || steps[i-1].done)
              return (
                <div key={i} className="checklist-step">
                  <div className={`checklist-icon ${step.done ? 'done' : isActive ? 'active' : 'pending'}`}>
                    {step.done ? '✓' : isActive ? '▶' : '○'}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', paddingTop: 4, color: step.done ? 'var(--accent-green)' : isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {step.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column — Submission Terminal */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <h2 className="font-display" style={{ fontSize: 20, letterSpacing: '0.06em' }}>SUBMISSION TERMINAL</h2>
              </div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--accent-cyan)' }}>SECURE UPLINK: 128-BIT ENCRYPTION ACTIVE</div>
            </div>
          </div>

          {/* Track Selection */}
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>SELECT STRATEGIC TRACK</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { id: 'SMART_AGRICULTURE', label: 'Smart Agriculture', icon: '🌾' },
              { id: 'DISASTER_FLOOD_RESPONSE', label: 'Disaster & Flood Response', icon: '🌊' },
            ].map(t => (
              <div key={t.id} className={`track-card ${team?.track === t.id ? 'selected' : ''}`} style={{ padding: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                <div className="font-display" style={{ fontSize: 14 }}>{t.label}</div>
              </div>
            ))}
          </div>

          {/* PDF Upload zone */}
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>TECHNICAL PROPOSAL UPLOAD (PDF)</div>
          <a href="/submissions" style={{ textDecoration: 'none' }}>
            <div className="upload-zone" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⬆</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Drag and drop mission brief</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Max file size: 20MB. Format: PDF only.</div>
            </div>
          </a>

          {/* GISTDA Declaration */}
          <div style={{ display: 'flex', gap: 12, padding: 16, background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--accent-cyan)', borderRadius: 3, flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              I declare that this project utilizes{' '}
              <strong style={{ color: 'var(--accent-amber)' }}>Sphere of GISTDA</strong>{' '}
              and adheres to the multispectral processing guidelines established in the hackathon brief. Any data discrepancies must be reported immediately.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button className="btn btn-outline" style={{ padding: '12px', justifyContent: 'center' }}>SAVE MISSION DRAFT</button>
            <a href="/submissions" className="btn btn-primary" style={{ textDecoration: 'none', padding: '12px', justifyContent: 'center', display: 'flex', alignItems: 'center' }}>INITIATE SUBMISSION</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
