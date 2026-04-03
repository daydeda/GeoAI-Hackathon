'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import NavRail from '@/components/NavRail'
import { useAuth } from '@/contexts/AuthContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function DocumentVaultContent() {
  const { user } = useAuth()
  const [docInfo, setDocInfo] = useState<{ id: string; version: number; generatedAt: string; downloadUrl: string } | null>(null)
  const [team, setTeam] = useState<{ name: string; status: string; members: Array<{ fullName: string; email?: string; isLeader?: boolean }> } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const teamRes = await fetch(`${API}/api/v1/teams/my`, { credentials: 'include' })
      if (!teamRes.ok) return
      const teamData = await teamRes.json()
      setTeam(teamData)

      if (teamData.status === 'FINALIST') {
        const docRes = await fetch(`${API}/api/v1/teams/${teamData.id}/documents/permission-letter`, { credentials: 'include' })
        if (docRes.ok) setDocInfo(await docRes.json())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const isFinalist = team?.status === 'FINALIST'

  return (
    <div style={{ minHeight: '100vh', padding: 32, position: 'relative', overflow: 'hidden' }}>
      {/* Background watermark */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0, left: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        pointerEvents: 'none', zIndex: 0, paddingBottom: 80,
      }}>
        <div className="font-display" style={{ fontSize: 'clamp(48px, 10vw, 120px)', color: 'rgba(0, 229, 255, 0.03)', userSelect: 'none', letterSpacing: '0.2em' }}>
          GEOSPATIAL INTELLIGENCE
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 className="font-display" style={{ fontSize: 36 }}>Finalist Documents</h1>
            <span className="badge badge-pass">VERIFICATION: ACTIVE</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14, maxWidth: 600 }}>
            Access your official competition documents. These are generated only for teams that have reached Finalist status.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : !isFinalist ? (
          <div style={{ marginTop: 32, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🔒</div>
            <div className="font-display" style={{ fontSize: 24, color: 'var(--text-muted)', marginBottom: 8 }}>FINALIST STATUS REQUIRED</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Your team has not yet reached Finalist status. Documents will be unlocked upon promotion.</div>
          </div>
        ) : (
          <>
            {/* Team status banner */}
            <div style={{ marginTop: 24, marginBottom: 32, padding: 20, background: 'var(--bg-surface)', border: '1px solid var(--accent-cyan)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--glow-cyan-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(0, 230, 118, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✓</div>
                <div>
                  <div className="font-display" style={{ fontSize: 20, color: 'var(--accent-green)', letterSpacing: '0.08em' }}>FINALIST ONSITE</div>
                  {docInfo && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Verification Code: GX-{docInfo.id.slice(0, 8).toUpperCase()}</div>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ACTIVE TEAM</div>
                <div className="font-display" style={{ fontSize: 20 }}>{team?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>👥 {team?.members?.length ?? 0} Members Registered</div>
              </div>
            </div>

            {/* Member permission letters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="font-display" style={{ fontSize: 22 }}>Personalized Leave Letters</h2>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>FORMAT: PDF/A-3 COMPLIANT</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(team?.members ?? []).map((member, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-active)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    👤
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{member.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.isLeader ? 'Team Leader' : 'Member'}</div>
                  </div>
                  <span className="badge badge-pass">READY</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-outline" style={{ fontSize: 11, padding: '7px 14px' }}>
                      👁 PREVIEW TEMPLATE
                    </button>
                    {docInfo?.downloadUrl ? (
                      <a href={docInfo.downloadUrl} download className="btn btn-primary" style={{ fontSize: 11, padding: '7px 14px', textDecoration: 'none' }}>
                        ⬇ DOWNLOAD PDF
                      </a>
                    ) : (
                      <button className="btn btn-primary" style={{ fontSize: 11, padding: '7px 14px' }} disabled>
                        ⬇ GENERATING…
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Info note */}
            <div style={{ marginTop: 40, padding: '16px 20px', borderLeft: '3px solid var(--accent-amber)', background: 'rgba(255, 167, 38, 0.05)', borderRadius: 4 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--accent-amber)' }}>NOTE:</strong> Each document is a personalized PDF containing the participant&apos;s full name, team identity, and official signature/stamp from the organizers. These documents are legally binding for academic and professional leave applications.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--border-subtle)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 8 }}>
          {['LEGAL', 'PRIVACY POLICY', 'CONTACT SUPPORT'].map(l => (
            <a key={l} href="#" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>© 2026 GEOAI HACKATHON · PROPRIETARY GEOSPATIAL INTELLIGENCE</div>
      </footer>
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <AuthProvider>
      <div style={{ display: 'flex' }}>
        <NavRail />
        <main className="page-with-rail" style={{ flex: 1 }}>
          <DocumentVaultContent />
        </main>
      </div>
    </AuthProvider>
  )
}
