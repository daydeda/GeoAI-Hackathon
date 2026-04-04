'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useAlert } from '@/contexts/AlertContext'
import { Check, X, HelpCircle, LogOut } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || '/geoai-2026'

interface Team { name: string; track: string }
interface File { id: string; originalName: string; fileUrl?: string }
interface Score { nationalImpactScore: number; technologyMethodologyScore: number; requirementComplianceScore: number; feasibilityScore: number; comments: string }
interface Submission { id: string; submittedAt: string; team: Team; files: File[]; judgeScores: Score[]; abstract?: string }

type Tab = 'QUEUE' | 'PAST_REVIEWS' | 'SETTINGS'

function JudgeContent() {
  const { user, logout } = useAuth()
  const { showAlert } = useAlert()
  const [queue, setQueue] = useState<Submission[]>([])
  const [activeSubId, setActiveSubId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('QUEUE')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
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
      }
    } catch { } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  const unscoredQueue = useMemo(() => queue.filter(q => !q.judgeScores || q.judgeScores.length === 0), [queue])
  const scoredQueue = useMemo(() => queue.filter(q => q.judgeScores && q.judgeScores.length > 0), [queue])

  const currentTabQueue = activeTab === 'QUEUE' ? unscoredQueue : scoredQueue

  // Safe auto-select first item when tab changes or items load
  useEffect(() => {
    if (activeTab === 'QUEUE') {
      const exists = unscoredQueue.find(q => q.id === activeSubId)
      if (!exists && unscoredQueue.length > 0) {
        setActiveSubId(unscoredQueue[0].id)
      } else if (unscoredQueue.length === 0) {
        setActiveSubId(null)
      }
    } else if (activeTab === 'PAST_REVIEWS') {
      const exists = scoredQueue.find(q => q.id === activeSubId)
      if (!exists && scoredQueue.length > 0) {
        setActiveSubId(scoredQueue[0].id)
      } else if (scoredQueue.length === 0) {
        setActiveSubId(null)
      }
    }
  }, [activeTab, unscoredQueue, scoredQueue, activeSubId])
  
  const activeSub = currentTabQueue.find(q => q.id === activeSubId) || null

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
      if (res.ok) {
        setSuccessMessage(activeTab === 'PAST_REVIEWS' ? 'Scoring profile updated successfully!' : 'Scoring profile submitted! Moved to Past Reviews.')
        await fetchQueue() // refresh data, it will move to Past Reviews
      } else {
        showAlert('Failed to submit the scoring profile. The submission might be outdated or there is a server issue.', 'warning')
      }
    } catch {
      showAlert('An unexpected error occurred while communicating with the server.', 'error')
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      {successMessage && (
        <div className="fixed inset-0 bg-[rgba(5,13,26,0.85)] z-50 flex items-center justify-center backdrop-blur-xl transition-all duration-300">
           <div className="bg-[var(--bg-surface)] border border-[rgba(0,230,118,0.3)] p-8 sm:p-12 rounded-lg flex flex-col items-center gap-6 sm:gap-8 shadow-2xl animate-appear">
              <style>{`
                @keyframes appear {
                  0% { opacity: 0; transform: scale(0.95) translateY(10px); }
                  100% { opacity: 1; transform: scale(1) translateY(0); }
                }
              `}</style>
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-[rgba(0,230,118,0.1)] flex items-center justify-center border-2 border-[var(--accent-green)] text-3xl sm:text-4xl text-[var(--accent-green)]">
                ✓
              </div>
              <div className="text-center">
                 <h2 className="font-display text-xl sm:text-2xl lg:text-3xl text-white mb-2 sm:mb-3 font-bold tracking-wider">SUCCESSFUL UPDATE</h2>
                 <p className="text-[var(--text-secondary)] text-sm sm:text-base mb-4 sm:mb-6">{successMessage}</p>
                 
                 <button 
                   onClick={() => setSuccessMessage(null)}
                   className="bg-[var(--accent-green)] text-black px-6 sm:px-8 py-2 sm:py-3 font-bold text-xs sm:text-sm tracking-widest rounded hover:brightness-110 transition"
                 >
                   CONTINUE REVIEWING
                 </button>
              </div>
           </div>
        </div>
      )}
      
      {/* Outer Judge Sidebar */}
      <div className="hidden sm:flex sm:w-40 md:w-48 lg:w-60 bg-[var(--bg-base)] border-r border-[rgba(255,255,255,0.05)] flex-col py-4 sm:py-6 lg:py-8 px-3 sm:px-4">
        <div className="px-3 sm:px-4 mb-6 sm:mb-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <span className="text-lg sm:text-xl text-[var(--accent-cyan)]">🛡</span>
            <div className="text-white text-xs sm:text-sm font-bold tracking-wider">LEAD JUDGE</div>
          </div>
          <div className="text-[8px] sm:text-[9px] text-[var(--text-muted)] tracking-widest pl-6 sm:pl-8">{user?.roles?.includes('ADMIN') ? 'ADMINISTRATOR' : 'ORBITAL SECTOR 7'}</div>
        </div>

        <div className="flex flex-col gap-1">
          {[
            { tab: 'QUEUE' as Tab, icon: '⚖️', label: 'JUDGING QUEUE' },
            { tab: 'PAST_REVIEWS' as Tab, icon: '📜', label: 'PAST REVIEWS' },
            { tab: 'SETTINGS' as Tab, icon: '⚙️', label: 'SYSTEM SETTINGS' }
          ].map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 cursor-pointer text-xs sm:text-sm font-semibold tracking-wider transition border-l-3 ${
                activeTab === tab
                  ? 'bg-[rgba(0,229,255,0.05)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <span>{icon}</span> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1"></div>

        <div className="px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-3 sm:gap-4 border-t border-[rgba(255,255,255,0.05)]">
          <button className="text-[var(--text-secondary)] text-xs sm:text-sm font-semibold tracking-wider flex items-center gap-2 hover:text-white transition">
            <HelpCircle size={16} /> <span className="hidden sm:inline">HELP CENTER</span>
          </button>
          <button onClick={logout} className="text-[var(--text-muted)] text-xs sm:text-sm font-semibold tracking-wider flex items-center gap-2 hover:text-white transition">
            <LogOut size={16} /> <span className="hidden sm:inline">LOG OUT</span>
          </button>
        </div>
      </div>

      {activeTab === 'SETTINGS' ? (
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col">
           <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white mb-6 sm:mb-8">SYSTEM SETTINGS</h1>
           <div className="bg-[var(--bg-surface)] p-6 sm:p-8 rounded border border-[rgba(255,255,255,0.05)] max-w-2xl">
             <p className="text-[var(--text-secondary)] leading-relaxed text-sm sm:text-base">System configuration for the judging environment. Manage your profile, notification preferences, and rubric templates here.</p>
             <div className="mt-6 sm:mt-8 flex flex-col gap-4">
               {[
                 { label: 'Email Notifications', checked: true },
                 { label: 'Dark Mode Override', checked: true }
               ].map(({ label, checked }) => (
                 <div key={label} className="flex justify-between items-center py-3 sm:py-4 border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-white text-sm sm:text-base">{label}</span>
                    <input type="checkbox" defaultChecked={checked} className="w-4 h-4 accent-[var(--accent-cyan)]" />
                 </div>
               ))}
             </div>
           </div>
        </div>
      ) : (
        <>
          {/* Inner Queue Sidebar */}
          <div className="hidden md:flex md:w-56 lg:w-64 bg-[var(--bg-surface)] border-r border-[rgba(255,255,255,0.05)] flex-col overflow-y-auto">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'baseline' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {activeTab.replace('_', ' ')} <span style={{ color: 'var(--text-muted)' }}>({String(currentTabQueue.length).padStart(2, '0')})</span>
              </h2>
              <span style={{ color: 'var(--text-muted)' }}>▼</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, paddingRight: 8 }}>
              {currentTabQueue.map(q => {
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
              {currentTabQueue.length === 0 && !loading && (
                <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 12, padding: 16, textAlign: 'center' }}>
                  NO TEAMS {activeTab === 'QUEUE' ? 'PENDING' : 'SCORED'}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          {activeSub ? (
            <div className="flex-1 flex flex-col overflow-hidden">
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
                       VIEW ORIGINAL PDF IN NEW TAB
                    </button>
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Note Area - Proposal PDF Viewer */}
                <div style={{ flex: 1, padding: 48, background: 'rgba(5, 13, 26, 0.4)', overflowY: 'auto' }}>
                  <div style={{ padding: 40, background: 'var(--bg-surface)', borderRadius: 4, minHeight: 600, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                      <span style={{ color: 'var(--accent-cyan)' }}>📄</span>
                      <h3 style={{ fontSize: 13, letterSpacing: '0.1em', color: 'white', fontWeight: 600 }}>PROPOSAL ABSTRACT / EXECUTIVE SUMMARY</h3>
                    </div>
                    <div style={{ flex: 1, padding: 24, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, overflowY: 'auto' }}>
                      {activeSub.abstract ? (
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                          {activeSub.abstract}
                        </div>
                      ) : (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                          <p style={{ fontSize: 13 }}>No automated summary available for this proposal.</p>
                          <p style={{ fontSize: 11, marginTop: 8 }}>Please review the original PDF for details.</p>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 40, padding: 24, background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent-amber)' }}>📊</span>
                        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', color: 'white' }}>TECHNICAL ANNEX (DATASET & ARCHITECTURE)</span>
                      </div>
                      <span style={{ color: 'white' }}>＋</span>
                    </div>
                  </div>
                </div>

                {/* Right Rubric Area */}
                <div style={{ width: 420, padding: 48, borderLeft: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', background: 'var(--bg-surface)' }}>
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
                            value={scores[c.key as keyof typeof scores] || 0} 
                            onChange={e => setScores({ ...scores, [c.key]: Number(e.target.value) })}
                            style={{ width: 50, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--accent-cyan)', padding: '4px 8px', textAlign: 'center', fontSize: 13, borderRadius: 2 }}
                          />
                        </div>
                        <input 
                          type="range" min="0" max="100" 
                          value={scores[c.key as keyof typeof scores] || 0} 
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

                  <button 
                    onClick={submitScore} 
                    style={{ width: '100%', background: 'var(--accent-cyan)', color: 'black', border: 'none', padding: 16, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2, transition: '0.2s ease' }}
                  >
                    {activeTab === 'PAST_REVIEWS' ? 'UPDATE SCORING PROFILE' : 'SUBMIT SCORING PROFILE'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div className="font-mono" style={{ color: 'var(--text-muted)' }}>QUEUE IS EMPTY.</div>
             </div>
          )}
        </>
      )}
    </div>
  )
}

export default function JudgePage() {
  return (
    <AuthProvider>
      <JudgeContent />
    </AuthProvider>
  )
}
