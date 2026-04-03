'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user: actor, loading: authLoading, logout } = useAuth()
  
  if (authLoading) {
    return (
      <div style={{ background: 'var(--bg-base)', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', gap: 20 }}>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '0.1em' }} className="font-display">GEOAI COMMAND</div>
        <div className="font-mono" style={{ fontSize: 13, letterSpacing: '0.2em', opacity: 0.8 }}>INITIALIZING SECURITY PROTOCOLS...</div>
        <div style={{ width: 200, height: 2, background: 'rgba(0, 229, 255, 0.1)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', height: '100%', background: 'var(--accent-cyan)', animation: 'scanline 2s infinite linear', width: '40%' }} />
        </div>
      </div>
    )
  }
  
  return (
    <>
      {/* Top Navbar */}
      <header style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)', height: 60, display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div className="font-display" style={{ color: 'var(--accent-cyan)', fontSize: 20, fontWeight: 700, letterSpacing: '0.05em' }}>GEOAI HACKATHON</div>
          <nav style={{ display: 'flex', gap: 24, fontSize: 13, color: 'white', fontWeight: 500 }}>
            <Link href="/team" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Challenges</Link>
            <Link href="/team" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Leaderboard</Link>
            <Link href="/resources" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Docs</Link>
            <Link href="/team" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Support</Link>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
          <span style={{ color: 'var(--accent-cyan)' }}>Role: {actor?.roles?.[0] || 'Unknown'}</span>
          <div style={{ padding: '4px 12px', background: 'var(--bg-surface)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{actor?.fullName || 'Guest'}</span>
            <span>👤</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        {/* Left Sidebar */}
        <aside style={{ width: 240, background: 'var(--bg-base)', borderRight: '1px solid var(--border-subtle)', height: '100%', padding: '32px 0 0 0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0 24px', marginBottom: 40 }}>
            <div style={{ color: 'var(--accent-cyan)', fontSize: 16, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>HACKATHON_v1.0</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ORBITAL COMMAND</div>
          </div>
          
          <div style={{ marginBottom: 40 }}>
            <div style={{ padding: '0 24px', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16 }}>MAIN MENU</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/dashboard" style={{ textDecoration: 'none', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12, color: pathname.startsWith('/dashboard') ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, background: pathname.startsWith('/dashboard') ? 'rgba(0, 229, 255, 0.05)' : 'transparent', borderLeft: pathname.startsWith('/dashboard') ? '3px solid var(--accent-cyan)' : '3px solid transparent' }}><span style={{ fontSize: 16 }}>⊞</span> OVERVIEW</Link>
              <Link href="/team" style={{ textDecoration: 'none', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12, color: pathname.startsWith('/team') ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, background: pathname.startsWith('/team') ? 'rgba(0, 229, 255, 0.05)' : 'transparent', borderLeft: pathname.startsWith('/team') ? '3px solid var(--accent-cyan)' : '3px solid transparent' }}><span style={{ fontSize: 16 }}>👥</span> MY TEAM</Link>
              <Link href="/submissions" style={{ textDecoration: 'none', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12, color: pathname.startsWith('/submissions') ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, background: pathname.startsWith('/submissions') ? 'rgba(0, 229, 255, 0.05)' : 'transparent', borderLeft: pathname.startsWith('/submissions') ? '3px solid var(--accent-cyan)' : '3px solid transparent' }}><span style={{ fontSize: 16 }}>📄</span> SUBMISSIONS</Link>
              <Link href="/resources" style={{ textDecoration: 'none', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, color: pathname.startsWith('/resources') ? 'var(--accent-green)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, background: pathname.startsWith('/resources') ? 'rgba(0, 230, 118, 0.05)' : 'transparent', borderLeft: pathname.startsWith('/resources') ? '3px solid var(--accent-green)' : '3px solid transparent' }}><span style={{ fontSize: 16 }}>📚</span> RESOURCES</Link>
            </div>
          </div>
          
          {actor?.roles?.includes('ADMIN') && (
            <div>
              <div style={{ padding: '0 24px', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16 }}>INTERNAL SYSTEMS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/admin" style={{ textDecoration: 'none', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, color: pathname === '/admin' ? 'var(--accent-green)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, background: pathname === '/admin' ? 'rgba(0, 230, 118, 0.05)' : 'transparent', borderLeft: pathname === '/admin' ? '3px solid var(--accent-green)' : '3px solid transparent' }}><span style={{ fontSize: 16 }}>🛡</span> ADMIN PANEL</Link>
                <Link href="/admin/logs" style={{ textDecoration: 'none', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, color: pathname.startsWith('/admin/logs') ? 'var(--accent-green)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, background: pathname.startsWith('/admin/logs') ? 'rgba(0, 230, 118, 0.05)' : 'transparent', borderLeft: pathname.startsWith('/admin/logs') ? '3px solid var(--accent-green)' : '3px solid transparent' }}><span style={{ fontSize: 16 }}>📋</span> LOGS</Link>
              </div>
            </div>
          )}

          {(actor?.roles?.includes('MODERATOR') || actor?.roles?.includes('ADMIN')) && (
            <div style={{ marginTop: 24 }}>
              <div style={{ padding: '0 24px', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16 }}>PRE-SCREENING</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/moderator" style={{ textDecoration: 'none', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, color: pathname.startsWith('/moderator') ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, background: pathname.startsWith('/moderator') ? 'rgba(0, 229, 255, 0.05)' : 'transparent', borderLeft: pathname.startsWith('/moderator') ? '3px solid var(--accent-cyan)' : '3px solid transparent' }}><span style={{ fontSize: 16 }}>⚖</span> MODERATOR DASH</Link>
              </div>
            </div>
          )}

          {(actor?.roles?.includes('JUDGE') || actor?.roles?.includes('ADMIN')) && (
            <div style={{ marginTop: 24 }}>
              <div style={{ padding: '0 24px', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16 }}>SCORING SYSTEM</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/judge" style={{ textDecoration: 'none', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, color: pathname.startsWith('/judge') ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, background: pathname.startsWith('/judge') ? 'rgba(0, 229, 255, 0.05)' : 'transparent', borderLeft: pathname.startsWith('/judge') ? '3px solid var(--accent-cyan)' : '3px solid transparent' }}><span style={{ fontSize: 16 }}>📝</span> EVALUATION QUEUE</Link>
              </div>
            </div>
          )}

          <div style={{ flex: 1 }}></div>

          <div style={{ padding: '24px' }}>
            {actor?.team?.isLeader && (
              <Link href="/submissions" style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
                <button style={{ width: '100%', background: 'linear-gradient(90deg, #4DD0E1, #00E5FF)', color: 'var(--bg-base)', border: 'none', padding: '12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer', display: 'block' }}>
                  NEW PROPOSAL
                </button>
              </Link>
            )}
            <button onClick={logout} style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '8px', fontSize: 11, cursor: 'pointer', borderRadius: 4 }}>
              ↪ LOGOUT
            </button>
          </div>
        </aside>

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </>
  )
}
