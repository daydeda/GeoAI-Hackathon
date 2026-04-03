'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Team { name: string; track: string }
interface File { fileKey: string; originalName: string }
interface Review { status: 'PASS' | 'FAIL' }
interface Submission { id: string; submittedAt: string; team: Team; files: File[]; moderatorReview: Review | null }

function ModeratorContent() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters
  const [trackFilter, setTrackFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

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
      }
    } finally {
      setLoading(false)
    }
  }, [trackFilter, statusFilter])

  useEffect(() => { fetchSubmissions() }, [fetchSubmissions])

  const submitReview = async (submissionId: string, status: 'PASS' | 'FAIL') => {
    try {
      const res = await fetch(`${API}/api/v1/mod/submissions/${submissionId}/review`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: '' })
      })
      if (res.ok) fetchSubmissions()
    } catch { }
  }

  const passed = submissions.filter(s => s.moderatorReview?.status === 'PASS').length
  const failed = submissions.filter(s => s.moderatorReview?.status === 'FAIL').length
  const pending = submissions.length - passed - failed
  
  const filtered = submissions.filter(s => search === '' || s.team.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ padding: '40px 60px', maxWidth: 1440, margin: '0 auto', background: 'var(--bg-base)', minHeight: '100vh' }}>
      <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent-green)', marginBottom: 8, letterSpacing: '0.1em' }}>INTERNAL OPERATIONS</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <h1 className="font-display" style={{ fontSize: 44, color: 'white' }}>Moderator Dashboard</h1>
        <div style={{ textAlign: 'right' }}>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>SYSTEM_STATUS: NOMINAL</div>
          <div style={{ fontSize: 12, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <span style={{ width: 8, height: 8, background: 'var(--accent-green)', borderRadius: '50%' }} /> OPERATIONAL
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 32 }}>
        {[
          { label: 'TOTAL PROPOSALS', value: total, span: '+12%', color: 'white' },
          { label: 'PENDING REVIEWS', value: pending, span: 'Critical', color: 'var(--accent-amber)' },
          { label: 'TOTAL PASSED', value: passed, span: '89.5%', color: 'var(--accent-green)' },
          { label: 'TOTAL FAILED', value: failed, span: '27.2%', color: 'var(--accent-red)' }
        ].map((stat, i) => (
          <div key={i} style={{ padding: '24px 32px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: 'var(--bg-surface)' }}>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>{stat.label}</div>
            <div className="font-display" style={{ fontSize: 40, color: stat.color, display: 'flex', alignItems: 'baseline', gap: 12 }}>
              {loading ? '...' : stat.value}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{stat.span}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-surface)', padding: '20px 32px', display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'white' }}>≡ FILTERS</div>
        <select style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 24px 8px 0', outline: 'none' }} value={trackFilter} onChange={e => setTrackFilter(e.target.value)}>
          <option value="">ALL TRACKS</option>
          <option value="SMART_AGRICULTURE">Smart Agriculture</option>
          <option value="DISASTER_FLOOD_RESPONSE">Disaster Response</option>
        </select>
        <select style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 24px 8px 0', outline: 'none' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">ALL STATUS</option>
          <option value="PENDING">Pending</option>
          <option value="PASS">Passed</option>
          <option value="FAIL">Failed</option>
        </select>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <input 
            placeholder="Search team names..." 
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 16px', width: 280, borderRadius: 2 }} 
          />
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '20px 32px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>TEAM NAME</th>
              <th style={{ padding: '20px 32px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>TRACK</th>
              <th style={{ padding: '20px 32px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>SUBMISSION DATE</th>
              <th style={{ padding: '20px 32px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ARTIFACTS</th>
              <th style={{ padding: '20px 32px', textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>STATUS</th>
              <th style={{ padding: '20px 32px', textAlign: 'right', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>QUICK ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '24px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 24, height: 24, background: 'rgba(0,229,255,0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, borderRadius: 2 }}>
                      {s.team.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>{s.team.name}</div>
                  </div>
                </td>
                <td style={{ padding: '24px 32px', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {s.team.track.replace(/_/g, ' ')}
                </td>
                <td style={{ padding: '24px 32px' }}>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(s.submittedAt).toLocaleDateString()}</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{new Date(s.submittedAt).toLocaleTimeString()}</div>
                </td>
                <td style={{ padding: '24px 32px' }}>
                  {s.files[0] ? (
                    <a href={`${API}/api/v1/submissions/${s.id}/view`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer' }}>
                        📄 {s.files[0].originalName.toUpperCase()}
                      </span>
                    </a>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                      NO ATTACHMENT
                    </span>
                  )}
                </td>
                <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                  {!s.moderatorReview ? (
                    <span style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(255, 171, 0, 0.1)', color: 'var(--accent-amber)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', borderRadius: 2 }}>■ PENDING</span>
                  ) : s.moderatorReview.status === 'PASS' ? (
                    <span style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(0, 230, 118, 0.1)', color: 'var(--accent-green)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', borderRadius: 2 }}>■ PASSED</span>
                  ) : (
                    <span style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(255, 23, 68, 0.1)', color: 'var(--accent-red)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', borderRadius: 2 }}>■ FAILED</span>
                  )}
                </td>
                <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                  {!s.moderatorReview ? (
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button onClick={() => submitReview(s.id, 'PASS')} style={{ width: 32, height: 32, background: 'rgba(0,230,118,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                      <button onClick={() => submitReview(s.id, 'FAIL')} style={{ width: 32, height: 32, background: 'rgba(255,23,68,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255,23,68,0.3)', borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ) : (
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em', fontWeight: 600 }}>RE-REVIEW</button>
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
