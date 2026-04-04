'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem { href: string; label: string; icon: string; roles?: string[] }

const NAV_SECTIONS = [
  {
    label: 'MAIN MENU',
    items: [
      { href: '/dashboard', label: 'Overview', icon: '⊞' },
      { href: '/team', label: 'My Team', icon: '⊙' },
      { href: '/submissions', label: 'Submissions', icon: '⊡' },
      { href: '/resources', label: 'Resources', icon: '⊟' },
      { href: '/documents', label: 'Documents', icon: '⊠' },
    ] as NavItem[],
  },
  {
    label: 'INTERNAL SYSTEMS',
    items: [
      { href: '/mod', label: 'Mod Panel', icon: '⊛', roles: ['MODERATOR', 'ADMIN'] },
      { href: '/judge', label: 'Judge Queue', icon: '⊜', roles: ['JUDGE', 'ADMIN', 'MODERATOR'] },
      { href: '/admin', label: 'Admin Panel', icon: '⊝', roles: ['ADMIN', 'MODERATOR'] },
      { href: '/admin/logs', label: 'Logs', icon: '≡', roles: ['ADMIN', 'MODERATOR'] },
    ] as NavItem[],
  },
]

export default function NavRail() {
  const pathname = usePathname()
  const { user, logout, loading } = useAuth()

  if (loading) return null

  return (
    <nav className="nav-rail" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
          HACKATHON_v1.0
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: 2 }}>ORBITAL COMMAND</div>
      </div>

      {/* Nav sections */}
      {NAV_SECTIONS.map(section => {
        const visibleItems = section.items.filter(item =>
          !item.roles || item.roles.some(r => user?.roles?.includes(r))
        )
        if (visibleItems.length === 0) return null

        return (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {visibleItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
              >
                <span style={{ fontSize: 16, opacity: 0.8 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        )
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* New Proposal CTA */}
      {user?.team?.isLeader && (
        <div style={{ padding: '0 16px 16px' }}>
          <Link href="/submissions" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
            NEW PROPOSAL
          </Link>
        </div>
      )}

      {/* User info */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--accent-cyan)' }}>
              {user?.fullName?.[0] ?? '?'}
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName ?? 'Guest'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--accent-cyan)', letterSpacing: '0.08em' }}>
              Role: {user?.roles?.[0] ?? 'GUEST'}
            </div>
          </div>
        </div>
        <button onClick={logout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11, padding: '6px' }}>
          ↪ LOGOUT
        </button>
      </div>
    </nav>
  )
}
