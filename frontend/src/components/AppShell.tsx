'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Menu,
  Scale,
  ScrollText,
  Shield,
  Trophy,
  UserCircle2,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  activeColor?: string
}

const topLinks = [
  { href: '/team', label: 'Challenges' },
  { href: '/team', label: 'Leaderboard' },
  { href: '/resources', label: 'Docs' },
  { href: '/team', label: 'Support' },
]

const baseMenu: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { href: '/team', label: 'My Team', icon: Users },
  { href: '/submissions', label: 'Submissions', icon: FileText },
  { href: '/resources', label: 'Resources', icon: BookOpen, activeColor: 'var(--accent-green)' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user: actor, loading: authLoading, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const adminMenu = useMemo(() => {
    if (!actor?.roles?.includes('ADMIN')) return [] as NavItem[]
    return [
      { href: '/admin', label: 'Admin Panel', icon: Shield, activeColor: 'var(--accent-green)' },
      { href: '/admin/logs', label: 'Logs', icon: ScrollText, activeColor: 'var(--accent-green)' },
    ]
  }, [actor?.roles])

  const moderatorMenu = useMemo(() => {
    if (!actor?.roles?.some((role) => role === 'MODERATOR' || role === 'ADMIN')) return [] as NavItem[]
    return [{ href: '/moderator', label: 'Moderator Dash', icon: Scale }]
  }, [actor?.roles])

  const judgeMenu = useMemo(() => {
    if (!actor?.roles?.some((role) => role === 'JUDGE' || role === 'ADMIN')) return [] as NavItem[]
    return [{ href: '/judge', label: 'Evaluation Queue', icon: ClipboardCheck }]
  }, [actor?.roles])

  const isActiveRoute = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[var(--bg-base)] px-6 text-center text-[var(--accent-cyan)]">
        <div className="font-display text-3xl font-bold tracking-[0.12em] sm:text-4xl">GEOAI COMMAND</div>
        <div className="font-mono text-xs tracking-[0.2em] opacity-80 sm:text-sm">INITIALIZING SECURITY PROTOCOLS...</div>
        <div className="relative h-[2px] w-52 overflow-hidden bg-[rgba(0,229,255,0.1)]">
          <div
            className="absolute h-full w-2/5 bg-[var(--accent-cyan)]"
            style={{ animation: 'scanline 2s infinite linear' }}
          />
        </div>
      </div>
    )
  }

  const menuItem = (item: NavItem, onClick?: () => void) => {
    const active = isActiveRoute(item.href)
    const iconColor = active
      ? item.activeColor || 'var(--accent-cyan)'
      : 'var(--text-secondary)'
    const textColor = active
      ? item.activeColor || 'var(--accent-cyan)'
      : 'var(--text-secondary)'

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        className="group flex items-center gap-3 border-l-[3px] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.05em] transition-all sm:text-sm"
        style={{
          color: textColor,
          borderLeftColor: active ? (item.activeColor || 'var(--accent-cyan)') : 'transparent',
          background: active ? 'rgba(0, 229, 255, 0.05)' : 'transparent',
        }}
      >
        <item.icon size={16} style={{ color: iconColor }} aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      <header className="sticky top-0 z-[100] border-b border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 sm:px-4 lg:px-8 py-3 md:py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="font-display text-sm sm:text-base md:text-lg font-bold tracking-widest text-[var(--accent-cyan)] truncate">
              GEOAI
            </div>
            <nav className="hidden lg:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-medium">
              {topLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm min-w-0">
            <span className="hidden md:inline text-[var(--accent-cyan)] font-mono text-[10px] lg:text-xs">
              {actor?.roles?.[0] || 'GUEST'}
            </span>
            <div className="flex items-center gap-2 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 sm:px-3 py-1.5 min-w-0">
              <UserCircle2 size={16} className="text-[var(--text-secondary)] flex-shrink-0" aria-hidden="true" />
              <span className="max-w-[6rem] sm:max-w-[10rem] truncate text-[var(--text-secondary)] text-xs sm:text-sm">
                {actor?.fullName || 'Guest'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="flex h-[calc(100vh-65px)]">
        <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-base)] pt-8 lg:flex">
          <div className="mb-8 px-6">
            <div className="text-base font-semibold tracking-[0.05em] text-[var(--accent-cyan)]">HACKATHON_v1.0</div>
            <div className="font-mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]">ORBITAL COMMAND</div>
          </div>

          <div className="mb-6">
            <div className="px-6 pb-3 text-[10px] tracking-[0.1em] text-[var(--text-muted)]">MAIN MENU</div>
            <div className="space-y-1">{baseMenu.map((item) => menuItem(item))}</div>
          </div>

          {adminMenu.length > 0 && (
            <div className="mb-6">
              <div className="px-6 pb-3 text-[10px] tracking-[0.1em] text-[var(--text-muted)]">INTERNAL SYSTEMS</div>
              <div className="space-y-1">{adminMenu.map((item) => menuItem(item))}</div>
            </div>
          )}

          {moderatorMenu.length > 0 && (
            <div className="mb-6">
              <div className="px-6 pb-3 text-[10px] tracking-[0.1em] text-[var(--text-muted)]">PRE-SCREENING</div>
              <div className="space-y-1">{moderatorMenu.map((item) => menuItem(item))}</div>
            </div>
          )}

          {judgeMenu.length > 0 && (
            <div className="mb-6">
              <div className="px-6 pb-3 text-[10px] tracking-[0.1em] text-[var(--text-muted)]">SCORING SYSTEM</div>
              <div className="space-y-1">{judgeMenu.map((item) => menuItem(item))}</div>
            </div>
          )}

          <div className="mt-auto space-y-3 p-6">
            {actor?.team?.isLeader && (
              <Link href="/submissions" className="btn btn-primary w-full justify-center text-xs">
                NEW PROPOSAL
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="inline-flex w-full items-center justify-center gap-2 rounded border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            >
              <LogOut size={14} aria-hidden="true" />
              LOGOUT
            </button>
          </div>
        </aside>

        <aside
          className={`fixed inset-y-0 left-0 z-[95] w-[86vw] max-w-[320px] transform border-r border-[var(--border-subtle)] bg-[var(--bg-base)] pt-5 transition-transform duration-200 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="flex items-center justify-between px-5 pb-4">
            <div>
              <div className="text-sm font-semibold tracking-[0.05em] text-[var(--accent-cyan)]">HACKATHON_v1.0</div>
              <div className="font-mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]">ORBITAL COMMAND</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-[var(--border-subtle)] text-[var(--text-secondary)]"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-4 pb-2 text-[10px] tracking-[0.1em] text-[var(--text-muted)]">MAIN MENU</div>
          <div className="space-y-1">{baseMenu.map((item) => menuItem(item, () => setMobileMenuOpen(false)))}</div>

          {adminMenu.length > 0 && (
            <>
              <div className="px-4 pb-2 pt-5 text-[10px] tracking-[0.1em] text-[var(--text-muted)]">INTERNAL SYSTEMS</div>
              <div className="space-y-1">{adminMenu.map((item) => menuItem(item, () => setMobileMenuOpen(false)))}</div>
            </>
          )}

          {moderatorMenu.length > 0 && (
            <>
              <div className="px-4 pb-2 pt-5 text-[10px] tracking-[0.1em] text-[var(--text-muted)]">PRE-SCREENING</div>
              <div className="space-y-1">{moderatorMenu.map((item) => menuItem(item, () => setMobileMenuOpen(false)))}</div>
            </>
          )}

          {judgeMenu.length > 0 && (
            <>
              <div className="px-4 pb-2 pt-5 text-[10px] tracking-[0.1em] text-[var(--text-muted)]">SCORING SYSTEM</div>
              <div className="space-y-1">{judgeMenu.map((item) => menuItem(item, () => setMobileMenuOpen(false)))}</div>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 space-y-3 p-4">
            {actor?.team?.isLeader && (
              <Link href="/submissions" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary w-full justify-center text-xs">
                NEW PROPOSAL
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="inline-flex w-full items-center justify-center gap-2 rounded border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-muted)]"
            >
              <LogOut size={14} />
              LOGOUT
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed bottom-4 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-cyan)] text-[var(--bg-base)] shadow-[0_0_24px_rgba(0,229,255,0.4)] lg:hidden"
        aria-label="Open quick menu"
      >
        <Trophy size={18} />
      </button>

      <Link
        href="/resources"
        className="fixed bottom-4 left-4 z-40 hidden items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-secondary)] shadow-lg sm:inline-flex lg:hidden"
      >
        <LifeBuoy size={14} />
        Support
      </Link>
    </div>
  )
}
