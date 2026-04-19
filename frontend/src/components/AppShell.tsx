'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Cog,
  FileText,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  Scale,
  ScrollText,
  Shield,
  ShieldCheck,
  Trophy,
  UserCheck,
  UserCircle2,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatPhaseDeadline } from '@/lib/phaseDeadline'
import { useCompetitionPhases } from '@/hooks/useCompetitionPhases'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function parseProfileError(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Profile update failed'

  const data = payload as {
    error?: unknown
    message?: unknown
  }

  if (typeof data.error === 'string') return data.error
  if (typeof data.message === 'string') return data.message

  if (data.error && typeof data.error === 'object') {
    const zodError = data.error as {
      fieldErrors?: Record<string, string[]>
      formErrors?: string[]
    }

    const formErrors = zodError.formErrors || []
    const fieldErrors = Object.entries(zodError.fieldErrors || {})
      .flatMap(([field, messages]) => (messages || []).map((msg) => `${field}: ${msg}`))

    const allErrors = [...formErrors, ...fieldErrors].filter(Boolean)
    if (allErrors.length > 0) return allErrors.join(' | ')
  }

  return 'Profile update failed'
}

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  activeColor?: string
}

const topLinks = [
  { href: '/team', label: 'Challenges' },
  { href: '/team', label: 'Leaderboard' },
  { href: '/docs', label: 'Docs' },
  { href: '/support', label: 'Contact Us' },
]

const baseMenu: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { href: '/team', label: 'My Team', icon: Users },
  { href: '/submissions', label: 'Submissions', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Cog },
  { href: '/resources', label: 'Resources', icon: BookOpen, activeColor: 'var(--accent-green)' },
  { href: '/support', label: 'Contact Us', icon: LifeBuoy },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user: actor, loading: authLoading, logout, refetch } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const { currentPhase } = useCompetitionPhases()
  const [profileData, setProfileData] = useState({
    firstName: actor?.profile?.firstName || '',
    lastName: actor?.profile?.lastName || '',
    experience: actor?.profile?.experience || '',
    university: actor?.profile?.university || '',
    yearOfStudy: actor?.profile?.yearOfStudy ? String(actor.profile.yearOfStudy) : '',
    phoneNumber: actor?.profile?.phoneNumber || '',
    address: actor?.profile?.address || '',
  })
  const [idCardFile, setIdCardFile] = useState<File | null>(null)

  const isModerator = actor?.roles?.includes('MODERATOR')
  const isAdmin = actor?.roles?.includes('ADMIN')
  const isPrivileged = Boolean(isAdmin || isModerator)

  const adminMenu = useMemo(() => {
    if (!isPrivileged) return [] as NavItem[]
    return [
      { href: '/admin', label: 'Admin Panel', icon: Shield, activeColor: 'var(--accent-green)' },
      { href: '/stats', label: 'Stats Overview', icon: BarChart3, activeColor: 'var(--accent-green)' },
      { href: '/admin/email', label: 'Email Dispatch', icon: Mail, activeColor: 'var(--accent-green)' },
      { href: '/admin/deadlines', label: 'Phase Deadlines', icon: Trophy, activeColor: 'var(--accent-green)' },
      { href: '/admin/logs', label: 'Logs', icon: ScrollText, activeColor: 'var(--accent-green)' },
    ]
  }, [isPrivileged])

  const moderatorMenu = useMemo(() => {
    if (!isPrivileged) return [] as NavItem[]
    return [
      { href: '/moderator', label: 'Submissions Review', icon: Scale },
      { href: '/moderator/verify', label: 'Moderator Review', icon: ShieldCheck },
    ]
  }, [isPrivileged])

  const judgeMenu = useMemo(() => {
    if (!actor?.roles?.some((role) => role === 'JUDGE' || role === 'ADMIN' || role === 'MODERATOR')) return [] as NavItem[]
    return [{ href: '/judge', label: 'Evaluation Queue', icon: ClipboardCheck }]
  }, [actor?.roles])

  const hasElevatedRole = Boolean(actor?.roles?.some((role) => role === 'ADMIN' || role === 'MODERATOR' || role === 'JUDGE'))
  const needsProfileSetup = Boolean(actor?.roles?.includes('COMPETITOR') && !hasElevatedRole && !actor?.profileCompleted)
  const phaseDeadline = useMemo(() => formatPhaseDeadline(currentPhase.date), [currentPhase.date])
  const primaryRole = actor?.roles?.[0] || 'GUEST'

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setProfileError('')

    setSavingProfile(true)
    try {
      const formData = new FormData()
      formData.append('firstName', profileData.firstName)
      formData.append('lastName', profileData.lastName)
      formData.append('experience', profileData.experience)
      formData.append('university', profileData.university)
      formData.append('yearOfStudy', profileData.yearOfStudy)
      formData.append('phoneNumber', profileData.phoneNumber)
      formData.append('address', profileData.address)
      if (idCardFile) formData.append('idCard', idCardFile)

      const response = await fetch(`${API}/api/v1/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(parseProfileError(payload))
      }

      await refetch()
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Profile update failed')
    } finally {
      setSavingProfile(false)
    }
  }

  const isActiveRoute = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-(--bg-base) px-6 text-center text-(--accent-cyan)">
        <div className="font-display text-3xl font-bold tracking-[0.12em] sm:text-4xl">GEOAI COMMAND</div>
        <div className="font-mono text-xs tracking-[0.2em] opacity-80 sm:text-sm">INITIALIZING SECURITY PROTOCOLS...</div>
        <div className="relative h-[2px] w-52 overflow-hidden bg-[rgba(0,229,255,0.1)]">
          <div
            className="absolute h-full w-2/5 bg-(--accent-cyan)"
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

  const resourcesSubMenu = (onClick?: () => void) => (
    <Link
      href="/resources/knowledge"
      onClick={onClick}
      className="group flex items-center gap-3 border-l-[3px] px-6 py-2.5 pl-12 text-xs font-semibold uppercase tracking-[0.05em] transition-all sm:text-sm"
      style={{
        color: 'var(--accent-green)',
        borderLeftColor: 'var(--accent-green)',
        background: 'rgba(0, 230, 118, 0.08)',
      }}
    >
      <BookOpen size={14} style={{ color: 'var(--accent-green)' }} aria-hidden="true" />
      <span>Knowledge</span>
    </Link>
  )

  return (
    <div className="min-h-screen flex flex-col bg-(--bg-base)">
      {needsProfileSetup && (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/70 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4"
          data-testid="profile-setup-overlay"
        >
          <form
            onSubmit={saveProfile}
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-y-auto rounded-lg border border-(--border-active) bg-(--bg-surface) p-5 shadow-[0_24px_48px_rgba(0,0,0,0.35)] sm:max-h-[calc(100dvh-2rem)] sm:p-8"
            data-testid="profile-setup-form"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl sm:text-2xl text-(--accent-cyan)">Complete Competitor Profile</h2>
              <span className="rounded border border-(--accent-cyan) bg-[rgba(0,229,255,0.08)] px-2 py-1 text-[10px] font-semibold tracking-[0.06em] text-(--accent-cyan)">
                REQUIRED
              </span>
            </div>
            <p className="mb-6 text-xs sm:text-sm text-(--text-secondary)">
              This is required for first-time signup. Your submitted information will be used in Team view and permission letter generation.
            </p>

            {profileError && <div className="mb-4 rounded border border-(--accent-red) bg-[rgba(255,23,68,0.08)] px-3 py-2 text-xs text-(--accent-red)">{profileError}</div>}

            <div className="rounded border border-(--border-subtle) bg-(--bg-base) p-4 sm:p-5">
              <div className="mb-3 text-xs font-semibold tracking-[0.06em] text-(--text-muted)">PROFILE INFORMATION</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input required placeholder="First Name" value={profileData.firstName} onChange={(e) => setProfileData((prev) => ({ ...prev, firstName: e.target.value }))} className="rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-sm" />
                <input required placeholder="Last Name" value={profileData.lastName} onChange={(e) => setProfileData((prev) => ({ ...prev, lastName: e.target.value }))} className="rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-sm" />
                <input required placeholder="University" value={profileData.university} onChange={(e) => setProfileData((prev) => ({ ...prev, university: e.target.value }))} className="rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-sm" />
                <input required type="number" min={1} max={12} placeholder="Year of Study" value={profileData.yearOfStudy} onChange={(e) => setProfileData((prev) => ({ ...prev, yearOfStudy: e.target.value }))} className="rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-sm" />
                <input required placeholder="Phone Number" value={profileData.phoneNumber} onChange={(e) => setProfileData((prev) => ({ ...prev, phoneNumber: e.target.value }))} className="rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-sm sm:col-span-2" />
                <textarea required placeholder="Address" value={profileData.address} onChange={(e) => setProfileData((prev) => ({ ...prev, address: e.target.value }))} className="min-h-24 rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-sm sm:col-span-2" />
                <textarea placeholder="Experience (Optional at sign-in)" value={profileData.experience} onChange={(e) => setProfileData((prev) => ({ ...prev, experience: e.target.value }))} className="min-h-24 rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-sm sm:col-span-2" />
              </div>
              <p className="mt-3 text-[11px] text-(--text-muted)">
                First Name, Last Name, University, Year of Study, Phone Number, and Address are required at first sign-in. Experience and Student ID are required for every team member before proposal submission.
              </p>
            </div>

            <div className="mb-6 mt-4 rounded border border-(--border-subtle) bg-(--bg-base) p-4 sm:p-5">
              <div className="mb-2 text-xs font-semibold tracking-[0.06em] text-(--text-muted)">STUDENT ID UPLOAD</div>
              <label className="mb-2 block text-xs text-(--text-secondary)">Upload Student ID (Optional, JPG/PNG/PDF, max 5MB)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                className="block w-full text-xs"
              />
              <p className="mt-2 text-[11px] text-(--text-muted)">
                You can continue without uploading now, but every team member must upload Student ID before proposal submission.
              </p>
            </div>

            <div className="sticky bottom-0 -mx-5 mt-5 border-t border-(--border-subtle) bg-(--bg-surface)/95 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-8 sm:px-8">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full rounded bg-(--accent-cyan) px-4 py-3 text-sm font-semibold text-(--bg-base) disabled:opacity-60"
              >
                {savingProfile ? 'Saving profile...' : 'Save and Continue'}
              </button>
            </div>
          </form>
        </div>
      )}
      <header className="sticky top-0 z-[100] border-b border-(--border-subtle) bg-(--bg-base) px-3 sm:px-4 lg:px-8 py-3 md:py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-md border border-(--border-subtle) text-(--text-secondary) hover:text-(--text-primary) transition-colors flex-shrink-0"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link href="/" className="font-display text-sm sm:text-base md:text-lg font-bold tracking-widest text-(--accent-cyan) truncate no-underline">
              GEOAI
            </Link>
            <nav className="hidden lg:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-medium">
              {topLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="text-(--text-secondary) hover:text-(--text-primary) transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm min-w-0">
            <span className="hidden md:inline text-(--accent-cyan) font-mono text-[10px] lg:text-xs">
              {primaryRole}
            </span>
            {primaryRole !== 'GUEST' && (
              <div className="hidden xl:flex items-center gap-2 rounded-sm border border-(--border-subtle) bg-(--bg-surface) px-3 py-1.5">
                <span className="font-mono text-[10px] text-(--text-muted)">CURRENT PHASE</span>
                <span className="text-xs font-semibold text-(--accent-cyan)">{currentPhase.title}</span>
                <span className="font-mono text-[10px] text-(--text-muted)">DEADLINE {phaseDeadline}</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-sm border border-(--border-subtle) bg-(--bg-surface) px-2 sm:px-3 py-1.5 min-w-0">
              <UserCircle2 size={16} className="text-(--text-secondary) flex-shrink-0" aria-hidden="true" />
              <span className="max-w-[6rem] sm:max-w-[10rem] truncate text-(--text-secondary) text-xs sm:text-sm">
                {actor?.fullName || 'Guest'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="flex min-h-[calc(100vh-65px)] items-stretch">
        <aside className="hidden min-h-[calc(100vh-65px)] w-64 shrink-0 self-stretch flex-col border-r border-(--border-subtle) bg-(--bg-base) pt-8 lg:flex">
          <div className="mb-8 px-6">
            <div className="text-base font-semibold tracking-[0.05em] text-(--accent-cyan)">HACKATHON_v1.0</div>
            <div className="font-mono text-[10px] tracking-[0.1em] text-(--text-muted)">ORBITAL COMMAND</div>
          </div>

          <div className="mb-6">
            <div className="px-6 pb-3 text-[10px] tracking-[0.1em] text-(--text-muted)">MAIN MENU</div>
            <div className="space-y-1">
              {baseMenu.map((item) => (
                <div key={item.href}>
                  {menuItem(item)}
                  {item.href === '/resources' && isActiveRoute('/resources') && resourcesSubMenu()}
                </div>
              ))}
            </div>
          </div>

          {adminMenu.length > 0 && (
            <div className="mb-6">
              <div className="px-6 pb-3 text-[10px] tracking-[0.1em] text-(--text-muted)">INTERNAL SYSTEMS</div>
              <div className="space-y-1">{adminMenu.map((item) => menuItem(item))}</div>
            </div>
          )}

          {moderatorMenu.length > 0 && (
            <div className="mb-6">
              <div className="px-6 pb-3 text-[10px] tracking-[0.1em] text-(--text-muted)">PRE-SCREENING</div>
              <div className="space-y-1">{moderatorMenu.map((item) => menuItem(item))}</div>
            </div>
          )}

          {judgeMenu.length > 0 && (
            <div className="mb-6">
              <div className="px-6 pb-3 text-[10px] tracking-[0.1em] text-(--text-muted)">SCORING SYSTEM</div>
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
              className="inline-flex w-full items-center justify-center gap-2 rounded border border-(--border-subtle) px-3 py-2 text-xs text-(--text-muted) transition hover:text-(--text-primary)"
            >
              <LogOut size={14} aria-hidden="true" />
              LOGOUT
            </button>
          </div>
        </aside>

        <aside
          className={`fixed inset-y-0 left-0 z-[95] flex w-[86vw] max-w-[320px] transform flex-col border-r border-(--border-subtle) bg-(--bg-base) pt-5 transition-transform duration-200 lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0">
            <div>
              <div className="text-sm font-semibold tracking-[0.05em] text-(--accent-cyan)">HACKATHON_v1.0</div>
              <div className="font-mono text-[10px] tracking-[0.1em] text-(--text-muted)">ORBITAL COMMAND</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-(--border-subtle) text-(--text-secondary)"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-8">
            <div className="px-4 pb-2 text-[10px] tracking-[0.1em] text-(--text-muted)">MAIN MENU</div>
            <div className="space-y-1">
              {baseMenu.map((item) => (
                <div key={item.href}>
                  {menuItem(item, () => setMobileMenuOpen(false))}
                  {item.href === '/resources' && isActiveRoute('/resources') && resourcesSubMenu(() => setMobileMenuOpen(false))}
                </div>
              ))}
            </div>

            {adminMenu.length > 0 && (
              <>
                <div className="px-4 pb-2 pt-5 text-[10px] tracking-[0.1em] text-(--text-muted)">INTERNAL SYSTEMS</div>
                <div className="space-y-1">{adminMenu.map((item) => menuItem(item, () => setMobileMenuOpen(false)))}</div>
              </>
            )}

            {moderatorMenu.length > 0 && (
              <>
                <div className="px-4 pb-2 pt-5 text-[10px] tracking-[0.1em] text-(--text-muted)">PRE-SCREENING</div>
                <div className="space-y-1">{moderatorMenu.map((item) => menuItem(item, () => setMobileMenuOpen(false)))}</div>
              </>
            )}

            {judgeMenu.length > 0 && (
              <>
                <div className="px-4 pb-2 pt-5 text-[10px] tracking-[0.1em] text-(--text-muted)">SCORING SYSTEM</div>
                <div className="space-y-1">{judgeMenu.map((item) => menuItem(item, () => setMobileMenuOpen(false)))}</div>
              </>
            )}
          </div>

          <div className="mt-auto space-y-3 border-t border-(--border-subtle) bg-(--bg-base) p-4 flex-shrink-0">
            {actor?.team?.isLeader && (
              <Link
                href="/submissions"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary w-full justify-center text-xs"
              >
                NEW PROPOSAL
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="inline-flex w-full items-center justify-center gap-2 rounded border border-(--border-subtle) px-3 py-2 text-xs text-(--text-muted) transition hover:text-(--text-primary)"
            >
              <LogOut size={14} />
              LOGOUT
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-visible">
          {children}
        </main>
      </div>

      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed bottom-4 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-(--accent-cyan) text-(--bg-base) shadow-[0_0_24px_rgba(0,229,255,0.4)] lg:hidden"
        aria-label="Open quick menu"
      >
        <Trophy size={18} />
      </button>

      <Link
        href="/support"
        className="fixed bottom-4 left-4 z-40 hidden items-center gap-2 rounded-full border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-xs text-(--text-secondary) shadow-lg sm:inline-flex lg:hidden"
      >
        <LifeBuoy size={14} />
        Contact Us
      </Link>
    </div>
  )
}
