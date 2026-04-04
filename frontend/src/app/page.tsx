'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X, MapPin, Zap, Clock } from 'lucide-react'

const DEADLINE = process.env.NEXT_PUBLIC_SUBMISSION_DEADLINE || '2026-05-01T23:59:59+07:00'

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 })
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return timeLeft
}

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center gap-1 sm:gap-2">
    <div className="countdown-digit text-2xl sm:text-3xl md:text-4xl font-display font-bold text-[var(--accent-cyan)]">
      {String(value).padStart(2, '0')}
    </div>
    <div className="countdown-label font-mono text-[10px] sm:text-xs text-[var(--text-muted)]">
      {label}
    </div>
  </div>
)

const tracks = [
  {
    id: 'smart-agriculture',
    icon: '🌾',
    title: 'Smart Agriculture',
    desc: 'Optimize crop predictions, soil health monitoring, and irrigation systems using real-time satellite imagery.',
    tags: ['NDVI Analysis', 'Crop Forecasting', 'Precision Farming'],
  },
  {
    id: 'disaster-flood',
    icon: '🌊',
    title: 'Disaster & Flood Response',
    desc: 'Design real-time flood mapping, infrastructure vulnerability models, and evacuation routing using GIS data and AI.',
    tags: ['Flood Mapping', 'SAR Imagery', 'Emergency Routing'],
  },
]

const timeline = [
  { phase: 'PHASE 01', title: 'Registration', desc: 'Form your team and declare your research intent.', status: 'done' },
  { phase: 'PHASE 02', title: 'Proposal Submission', desc: 'Upload technical proposal documents (PDF, max 20 MB).', status: 'active' },
  { phase: 'PHASE 03', title: 'Moderator Pre-screen', desc: 'Panel reviews proposals for requirement compliance.', status: 'upcoming' },
  { phase: 'PHASE 04', title: 'Judge Scoring', desc: 'Expert judges assess with a weighted rubric system.', status: 'upcoming' },
  { phase: 'PHASE 05', title: 'Finalist Documents', desc: 'Comprehensive documentation before the demonstration phase.', status: 'upcoming' },
  { phase: 'PHASE 06', title: 'Final Pitching', desc: 'Live 15-minute presentation to panel judges. Onsite.', status: 'upcoming' },
]

const sponsors = ['KMITL', 'ESRI', 'GISTDA', 'KMUTNB', 'ETDA']

export default function LandingPage() {
  const { days, hours, mins, secs } = useCountdown(DEADLINE)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[rgba(5,13,26,0.95)] backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-display text-base sm:text-lg md:text-xl font-bold text-[var(--accent-cyan)] tracking-widest">
            GEOAI
          </span>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            {['Challenges', 'Leaderboard', 'Docs', 'Support'].map(item => (
              <a
                key={item}
                href="#"
                className="text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
              >
                {item}
              </a>
            ))}
            <Link href="/login" className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[var(--accent-cyan)] text-[var(--bg-base)] rounded font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity">
              Register Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-3 border-t border-[var(--border-subtle)] pt-4">
            {['Challenges', 'Leaderboard', 'Docs', 'Support'].map(item => (
              <a
                key={item}
                href="#"
                className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {item}
              </a>
            ))}
            <Link
              href="/login"
              className="block px-4 py-2 bg-[var(--accent-cyan)] text-[var(--bg-base)] rounded font-semibold text-sm text-center hover:opacity-90 transition-opacity"
            >
              Register Now
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28 overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="max-w-4xl mx-auto relative">
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
            <span className="font-mono text-[10px] sm:text-xs text-[var(--text-muted)] tracking-widest">
              MISSION STARTED — 2026
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 sm:mb-6 text-[var(--text-primary)]">
            AGRI-DISASTER
            <br />
            <span className="text-[var(--accent-cyan)]" style={{ textShadow: 'var(--glow-cyan)' }}>
              AI HACKATHON
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-8 sm:mb-12">
            Harnessing hyperscaled AI data and orbital intelligence to build resilient agricultural ecosystems and rapid disaster response protocols for the next decade.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-[var(--accent-cyan)] text-[var(--bg-base)] rounded font-semibold text-sm sm:text-base hover:opacity-90 transition-all active:scale-95 w-full sm:w-auto"
            >
              <Zap size={18} />
              Continue with Google
            </Link>
            <a
              href="#timeline"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 border border-[var(--border-active)] text-[var(--text-primary)] rounded font-semibold text-sm sm:text-base hover:bg-[var(--bg-surface)] transition-colors w-full sm:w-auto"
            >
              View Technical Docs
            </a>
          </div>
        </div>
      </section>

      {/* ── Countdown ── */}
      <section className="border-t border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="font-mono text-[10px] sm:text-xs text-[var(--text-muted)] tracking-widest mb-2">
              SUBMISSION DEADLINE · PROTOCOL LOCK IN
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
            <TimeUnit value={days} label="DAYS" />
            <span className="text-2xl sm:text-3xl md:text-4xl text-[var(--accent-cyan)] font-light">:</span>
            <TimeUnit value={hours} label="HOURS" />
            <span className="text-2xl sm:text-3xl md:text-4xl text-[var(--accent-cyan)] font-light">:</span>
            <TimeUnit value={mins} label="MINS" />
            <span className="text-2xl sm:text-3xl md:text-4xl text-[var(--accent-cyan)] font-light">:</span>
            <TimeUnit value={secs} label="SECS" />
          </div>
        </div>
      </section>

      {/* ── Tracks ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="font-mono text-[10px] sm:text-xs text-[var(--text-muted)] tracking-widest mb-2">
              FOCUS TRACKS
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Select Your Mission
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl">
              Your track defines the operational scope using the following intelligence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {tracks.map(track => (
              <div
                key={track.id}
                className="p-6 sm:p-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-active)] transition-colors"
              >
                <div className="text-4xl sm:text-5xl mb-4">
                  {track.icon}
                </div>
                <h3 className="font-display text-xl sm:text-2xl mb-3 sm:mb-4 text-[var(--text-primary)]">
                  {track.title}
                </h3>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-4 sm:mb-6">
                  {track.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {track.tags.map(t => (
                    <span
                      key={t}
                      className="inline-block px-2 sm:px-3 py-1 bg-[var(--bg-base)] text-[var(--accent-cyan)] text-xs font-mono rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section id="timeline" className="bg-[var(--bg-surface)] px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 sm:mb-12">
            <div className="font-mono text-[10px] sm:text-xs text-[var(--text-muted)] tracking-widest mb-2">
              COMPETITION LIFECYCLE
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              Protocol Timeline
            </h2>
          </div>

          <div className="space-y-6 sm:space-y-8 relative">
            {/* Vertical line */}
            <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-[var(--border-subtle)]" />

            {timeline.map((item, i) => (
              <div key={i} className="pl-12 sm:pl-16 relative">
                {/* Circle dot */}
                <div
                  className="absolute left-0 sm:left-0.5 top-1 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm"
                  style={{
                    background:
                      item.status === 'done'
                        ? 'var(--accent-green)'
                        : item.status === 'active'
                          ? 'var(--accent-cyan)'
                          : 'var(--bg-elevated)',
                    boxShadow: item.status === 'active' ? 'var(--glow-cyan)' : 'none',
                    border: item.status === 'upcoming' ? '2px solid var(--border-subtle)' : 'none',
                    color: item.status === 'done' ? 'var(--bg-base)' : 'inherit',
                  }}
                >
                  {item.status === 'done' ? '✓' : null}
                </div>

                <div>
                  <div
                    className="font-mono text-xs sm:text-sm mb-1 tracking-widest"
                    style={{
                      color:
                        item.status === 'active'
                          ? 'var(--accent-cyan)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {item.phase}
                  </div>
                  <h3 className="font-display text-lg sm:text-xl mb-2" style={{
                    color: item.status === 'upcoming' ? 'var(--text-secondary)' : 'var(--text-primary)',
                  }}>
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
            READY TO
            <br />
            <span className="text-[var(--accent-cyan)]">DEPLOY?</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] leading-relaxed mb-8 sm:mb-12 max-w-2xl mx-auto">
            Join hundreds of researchers and developers in architecting a sustainable future through Geospatial AI.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--accent-cyan)] text-[var(--bg-base)] rounded font-semibold text-sm sm:text-base hover:opacity-90 transition-all active:scale-95"
          >
            <Zap size={18} />
            Register Now
          </Link>
        </div>
      </section>

      {/* ── Footer / Sponsors ── */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 lg:gap-12 mb-8">
            {sponsors.map(s => (
              <span
                key={s}
                className="font-display text-sm sm:text-base md:text-lg font-bold text-[var(--text-muted)] tracking-widest"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="text-center text-xs sm:text-sm text-[var(--text-muted)]">
            © 2026 GEOAI HACKATHON · PRECISION LENS UI ·{' '}
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
              Privacy Policy
            </a>
            {' · '}
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
