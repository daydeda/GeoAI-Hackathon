'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Team { name: string; track: string }
interface File { id: string; originalName: string; fileUrl?: string }
interface Score { nationalImpactScore: number; technologyMethodologyScore: number; requirementComplianceScore: number; feasibilityScore: number; comments: string }
interface Submission { id: string; submittedAt: string; team: Team; files: File[]; judgeScores: Score[] }

function JudgeContent() {
  const [queue, setQueue] = useState<Submission[]>([])
  const [activeSubId, setActiveSubId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Rubric State
  const [scores, setScores] = useState({
    nationalImpactScore: 0,
    technologyMethodologyScore: 0,
    requirementComplianceScore: 0,
    feasibilityScore: 0,
  })
  const [comments, setComments] = useState('')

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/judge/submissions?limit=50`, { credentials: 'include' })
      if (res.ok) {
        const d = await res.json()
        setQueue(d.data || [])
        if (!activeSubId && d.data?.length > 0) setActiveSubId(d.data[0].id)
      }
    } catch { } finally {
      setLoading(false)
    }
  }, [activeSubId])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  const activeSub = queue.find(q => q.id === activeSubId) || null

  useEffect(() => {
    if (activeSub?.judgeScores?.[0]) {
      const s = activeSub.judgeScores[0]
      setScores({
        nationalImpactScore: s.nationalImpactScore,
        technologyMethodologyScore: s.technologyMethodologyScore,
        requirementComplianceScore: s.requirementComplianceScore,
        feasibilityScore: s.feasibilityScore
      })
      setComments(s.comments || '')
    } else {
      setScores({ nationalImpactScore: 0, technologyMethodologyScore: 0, requirementComplianceScore: 0, feasibilityScore: 0 })
      setComments('')
    }
  }, [activeSub])

  const calcWeighted = () => {
    return (
      scores.nationalImpactScore * 0.40 +
      scores.technologyMethodologyScore * 0.30 +
      scores.requirementComplianceScore * 0.15 +
      scores.feasibilityScore * 0.15
    )
  }

  const submitScore = async () => {
    if (!activeSubId) return
    try {
      const res = await fetch(`${API}/api/v1/judge/submissions/${activeSubId}/scores`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scores, comments })
      })
      if (res.ok) fetchQueue()
    } catch { }
  }

  return (
    <div style={{ padding: '0', display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar Queue */}
      <div style={{ width: 320, background: 'var(--bg-surface)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'baseline' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'white', letterSpacing: '0.05em' }}>QUEUE <span style={{ color: 'var(--text-muted)' }}>({String(queue.length).padStart(2, '0')})</span></h2>
          <span style={{ color: 'var(--text-muted)' }}>▼</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {queue.map(q => {
            const isScored = q.judgeScores && q.judgeScores.length > 0;
            const isActive = q.id === activeSubId;
            return (
              <div 
                key={q.id} 
                onClick={() => setActiveSubId(q.id)}
                style={{ 
                  padding: 16, borderLeft: isActive ? '3px solid var(--accent-green)' : '3px solid transparent', 
                  background: isActive ? 'rgba(0,230,118,0.05)' : 'transparent',
                  cursor: 'pointer', transition: '0.2s ease', 
                  borderTop: '1px solid rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>{q.team.track.replace(/_/g, ' ')}</div>
                  <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>ID: {q.id.split('-')[1]?.substring(0,6) || q.id.substring(0,6)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 4 }}>PROJECT {q.team.name.toUpperCase()}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <span style={{ width: 6, height: 6, background: isScored ? 'var(--text-muted)' : 'var(--accent-green)', borderRadius: '50%' }} />
                  <span className="font-mono" style={{ fontSize: 9, color: isScored ? 'var(--text-muted)' : 'var(--accent-green)', letterSpacing: '0.05em' }}>
                    {isScored ? 'SCORED' : isActive ? 'CURRENTLY REVIEWING' : 'PENDING'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      {activeSub && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '32px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <span style={{ padding: '4px 8px', background: 'rgba(0,230,118,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(0,230,118,0.3)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600 }}>TRACK: {activeSub.team.track.replace(/_/g, ' ')}</span>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                  ● SUBMITTED: {new Date(activeSub.submittedAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="font-display" style={{ fontSize: 36, color: 'white', marginBottom: 8 }}>PROJECT {activeSub.team.name.toUpperCase()}</h1>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Team: <span style={{ color: 'white' }}>{activeSub.team.name}</span></div>
            </div>
            {activeSub.files[0] && (
              <a href={`${API}/api/v1/submissions/${activeSub.id}/view`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button style={{ background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '12px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>
                   VIEW ORIGINAL PDF
                </button>
              </a>
            )}
          </div>

          <div style={{ display: 'flex', flex: 1 }}>
            {/* Left Note Area */}
            <div style={{ flex: 1, padding: 48, background: 'rgba(5, 13, 26, 0.4)' }}>
              <div style={{ padding: 40, background: 'var(--bg-surface)', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                  <span style={{ color: 'var(--accent-cyan)' }}>📄</span>
                  <h3 style={{ fontSize: 13, letterSpacing: '0.1em', color: 'white', fontWeight: 600 }}>PROPOSAL ABSTRACT/EXECUTIVE SUMMARY</h3>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Project {activeSub.team.name} focuses on the {activeSub.team.track.replace(/_/g, ' ').toLowerCase()} sector. By leveraging Sentinel-2 L2A data and bespoke Transformers architecture, the solution identifies specific anomaly patterns tailored to regional specifications.
                  <br/><br/>
                  The core methodology relies on establishing consistent temporal analysis, bypassing typical constraints found in RGB imagery during heavy monsoon seasons to ensure year-round actionable intelligence.
                </p>
                <div style={{ marginTop: 40, padding: 24, background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent-amber)' }}>📊</span>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', color: 'white' }}>TECHNICAL ANNEX (DATASET & ARCHITECTURE)</span>
                  </div>
                  <span>＋</span>
                </div>
              </div>
            </div>

            {/* Right Rubric Area */}
            <div style={{ width: 420, padding: 48, borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: 'var(--accent-green)' }}>☑</span>
                  <h3 style={{ fontSize: 13, letterSpacing: '0.1em', color: 'white', fontWeight: 600 }}>RUBRIC SCORING</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>TOTAL WEIGHTED SCORE</div>
                  <div className="font-display" style={{ fontSize: 36, color: 'var(--accent-green)', lineHeight: 1 }}>
                    {calcWeighted().toFixed(1)} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 48 }}>
                {[
                  { key: 'nationalImpactScore', label: 'NATIONAL IMPACT', weight: 40 },
                  { key: 'technologyMethodologyScore', label: 'TECHNOLOGY & METHODOLOGY', weight: 30 },
                  { key: 'requirementComplianceScore', label: 'REQUIREMENT COMPLIANCE', weight: 15 },
                  { key: 'feasibilityScore', label: 'FEASIBILITY', weight: 15 },
                ].map(c => (
                  <div key={c.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>{c.label}</label>
                      <input 
                        type="number" min="0" max="100" 
                        value={scores[c.key as keyof typeof scores]} 
                        onChange={e => setScores({ ...scores, [c.key]: Number(e.target.value) })}
                        style={{ width: 44, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--accent-cyan)', padding: 4, textAlign: 'center', fontSize: 13, borderRadius: 2 }}
                      />
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={scores[c.key as keyof typeof scores]} 
                      onChange={e => setScores({ ...scores, [c.key]: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 16 }}>QUALITATIVE FEEDBACK</h3>
                <textarea 
                  placeholder="ENTER DETAILED TECHNICAL OBSERVATIONS..."
                  value={comments} onChange={e => setComments(e.target.value)}
                  style={{ width: '100%', height: 120, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: 16, fontSize: 12, resize: 'none', borderRadius: 4, outline: 'none' }}
                />
              </div>

              <button onClick={submitScore} style={{ width: '100%', background: 'var(--accent-cyan)', color: 'black', border: 'none', padding: 16, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>
                SUBMIT SCORING PROFILE
              </button>
            </div>
          </div>
        </div>
      )}
      {!activeSub && !loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="font-mono" style={{ color: 'var(--text-muted)' }}>QUEUE IS EMPTY.</div>
        </div>
      )}
    </div>
  )
}

export default function JudgePage() {
  return (
    <AuthProvider>
      <AppShell>
        <JudgeContent />
      </AppShell>
    </AuthProvider>
  )
}
