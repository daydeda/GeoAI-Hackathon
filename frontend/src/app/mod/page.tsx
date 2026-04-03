'use client'

import { useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import Link from 'next/link'

function ModContent() {
  const [search, setSearch] = useState('')

  // Mock data to match Image 4 precisely
  const submissions = [
    { id: '1', team: { name: 'Alpha Centauri Labs', initial: 'A' }, track: 'Atmospheric Mapping', submittedAt: '2024.11.08 14:32:01', artifact: 'PROPOSAL_V4.PDF', status: 'PENDING' },
    { id: '2', team: { name: 'Satellite Watchers', initial: 'S' }, track: 'Urban Expansion', submittedAt: '2024.11.08 12:10:55', artifact: 'URBAN_GROWTH_REPORT.PDF', status: 'PASSED' },
    { id: '3', team: { name: 'Neon Geospatial', initial: 'N' }, track: 'Oceanic Dynamics', submittedAt: '2024.11.07 23:45:12', artifact: 'WAVE_ANALYSIS_FINAL.PDF', status: 'FAILED' },
    { id: '4', team: { name: 'Eco-Sync Systems', initial: 'E' }, track: 'Vegetative Density', submittedAt: '2024.11.07 20:15:33', artifact: 'BIOMASS_DATASET_V2.PDF', status: 'PENDING' },
  ]

  return (
    <div style={{ padding: '40px 60px', maxWidth: 1440, margin: '0 auto', background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent-green)', marginBottom: 8, letterSpacing: '0.1em' }}>
            <span style={{ color: 'var(--accent-green)', marginRight: 6 }}>■</span> INTERNAL OPERATIONS
          </div>
          <h1 className="font-display" style={{ fontSize: 44, color: 'white' }}>Moderator Dashboard</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6 }}>SYSTEM_STATUS: NOMINAL</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <span style={{ width: 6, height: 6, background: 'var(--accent-green)', display: 'inline-block' }} />
            <span style={{ color: 'var(--accent-green)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 40, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { label: 'TOTAL PROPOSALS', value: '1,284', change: '+12%', changeColor: 'var(--accent-green)', color: 'white' },
          { label: 'PENDING REVIEWS', value: '42', change: 'Critical', changeColor: 'var(--accent-amber)', color: 'var(--accent-amber)' },
          { label: 'TOTAL PASSED', value: '892', change: '69.5%', changeColor: 'var(--text-muted)', color: 'var(--accent-green)' },
          { label: 'TOTAL FAILED', value: '350', change: '27.2%', changeColor: 'var(--text-muted)', color: '#ff6275' },
        ].map((s, i) => (
          <div key={i} style={{ 
            background: 'var(--bg-base)', padding: '24px 30px', 
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div className="font-display" style={{ fontSize: 42, color: s.color, lineHeight: 1, fontWeight: 700 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: s.changeColor, fontWeight: 500, paddingBottom: 6 }}>{s.change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, background: 'var(--bg-surface)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Filters */}
        <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 12, letterSpacing: '0.05em', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
              <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>≡</span> FILTERS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 4 }}>
              ALL TRACKS <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▼</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 4 }}>
              ALL STATUS <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▼</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="Search team names..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'var(--bg-base)', border: 'none', borderRadius: 4, padding: '10px 16px', fontSize: 12, width: 280, color: 'white', outline: 'none' }}
              />
              <span style={{ position: 'absolute', right: 16, top: 10, color: 'var(--text-muted)', fontSize: 14 }}>⚲</span>
            </div>
            <button style={{ background: 'var(--bg-elevated)', border: 'none', width: 40, height: 40, borderRadius: 4, color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ↻
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ padding: '10px 32px 32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '20px 0', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>TEAM NAME</th>
                <th style={{ padding: '20px 0', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>TRACK</th>
                <th style={{ padding: '20px 0', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>SUBMISSION<br/>DATE</th>
                <th style={{ padding: '20px 0', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>ARTIFACTS</th>
                <th style={{ padding: '20px 0', textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '20px 0', textAlign: 'right', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>QUICK<br/>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '20px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 24, height: 24, background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, fontSize: 12, fontWeight: 700 }}>
                        {sub.team.initial}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>{sub.team.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 0', fontSize: 12, color: 'var(--text-secondary)' }}>{sub.track}</td>
                  <td className="font-mono" style={{ padding: '20px 0', fontSize: 11, color: 'var(--text-muted)' }}>{sub.submittedAt.replace(' ', '\\n')}</td>
                  <td style={{ padding: '20px 0' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--accent-cyan)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>
                      <span style={{ fontSize: 14 }}>📄</span> {sub.artifact}
                    </div>
                  </td>
                  <td style={{ padding: '20px 0', textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 2, border: '1px solid',
                      ...(sub.status === 'PENDING' ? { color: 'var(--accent-amber)', borderColor: 'rgba(255,167,38,0.3)', background: 'rgba(255,167,38,0.1)' } : {}),
                      ...(sub.status === 'PASSED' ? { color: 'var(--accent-green)', borderColor: 'rgba(0,230,118,0.3)', background: 'rgba(0,230,118,0.1)' } : {}),
                      ...(sub.status === 'FAILED' ? { color: '#ff6275', borderColor: 'rgba(255,98,117,0.3)', background: 'rgba(255,98,117,0.1)' } : {}),
                    }}>
                      ■ {sub.status}
                    </span>
                  </td>
                  <td style={{ padding: '20px 0', textAlign: 'right' }}>
                    {sub.status === 'PENDING' ? (
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button style={{ width: 28, height: 28, background: 'rgba(0,230,118,0.1)', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                        <button style={{ width: 28, height: 28, background: 'rgba(255,98,117,0.1)', border: '1px solid #ff6275', color: '#ff6275', borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', cursor: 'pointer' }}>
                        {sub.status === 'PASSED' ? 'DETAILS' : 'RE-REVIEW'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SHOWING 1 TO 4 OF 1,284 ENTRIES</div>
            <div style={{ display: 'flex', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
              <button style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', marginRight: 8, cursor: 'pointer' }}>PREVIOUS</button>
              <button style={{ border: '1px solid var(--border-active)', background: 'rgba(0,229,255,0.1)', width: 24, height: 24, cursor: 'pointer', color: 'var(--accent-cyan)' }}>1</button>
              <button style={{ border: 'none', background: 'var(--bg-elevated)', width: 24, height: 24, cursor: 'pointer', color: 'white' }}>2</button>
              <button style={{ border: 'none', background: 'var(--bg-elevated)', width: 24, height: 24, cursor: 'pointer', color: 'white' }}>3</button>
              <button style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', marginLeft: 8, cursor: 'pointer' }}>NEXT</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
        <div>© 2024 GEOAI HACKATHON | PRECISION LENS UI</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <span>PRIVACY POLICY</span>
          <span>TERMS OF SERVICE</span>
        </div>
      </footer>
    </div>
  )
}

export default function ModPage() {
  return (
    <AuthProvider>
      {/* Top Navbar */}
      <header style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)', height: 60, display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div className="font-display" style={{ color: 'var(--accent-cyan)', fontSize: 20, fontWeight: 700, letterSpacing: '0.05em' }}>GEOAI HACKATHON</div>
          <nav style={{ display: 'flex', gap: 24, fontSize: 13, color: 'white', fontWeight: 500 }}>
            <Link href="#" style={{ color: 'var(--text-secondary)' }}>Challenges</Link>
            <Link href="#" style={{ color: 'var(--text-secondary)' }}>Leaderboard</Link>
            <Link href="#" style={{ color: 'var(--text-secondary)' }}>Docs</Link>
            <Link href="#" style={{ color: 'var(--text-secondary)' }}>Support</Link>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
          <span style={{ color: 'var(--accent-cyan)' }}>Role: Competitor</span>
          <div style={{ width: 28, height: 28, background: 'var(--bg-surface)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Left Sidebar specific to Admin/Mod to match image */}
        <aside style={{ width: 240, background: 'var(--bg-base)', borderRight: '1px solid var(--border-subtle)', minHeight: 'calc(100vh - 60px)', padding: '32px 0', flexShrink: 0 }}>
          <div style={{ padding: '0 24px', marginBottom: 40 }}>
            <div style={{ color: 'var(--accent-cyan)', fontSize: 16, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>HACKATHON_v1.0</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ORBITAL COMMAND</div>
          </div>
          
          <div style={{ marginBottom: 40 }}>
            <div style={{ padding: '0 24px', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16 }}>MAIN MENU</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}><span style={{ fontSize: 16 }}>⊞</span> OVERVIEW</div>
              <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}><span style={{ fontSize: 16 }}>👥</span> MY TEAM</div>
              <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent-green)', fontSize: 13, fontWeight: 500, background: 'rgba(0, 230, 118, 0.05)', borderLeft: '3px solid var(--accent-green)' }}><span style={{ fontSize: 16 }}>📄</span> SUBMISSIONS</div>
              <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}><span style={{ fontSize: 16 }}>📚</span> RESOURCES</div>
              <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}><span style={{ fontSize: 16 }}>⚙</span> SETTINGS</div>
            </div>
          </div>

          <div style={{ padding: '24px', marginTop: 40 }}>
            <button style={{ width: '100%', background: 'linear-gradient(90deg, #4DD0E1, #00E5FF)', color: 'var(--bg-base)', border: 'none', padding: '12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer', display: 'block' }}>
              NEW PROPOSAL
            </button>
          </div>
        </aside>

        <main style={{ flex: 1, overflowX: 'hidden' }}>
          <ModContent />
        </main>
      </div>
    </AuthProvider>
  )
}

