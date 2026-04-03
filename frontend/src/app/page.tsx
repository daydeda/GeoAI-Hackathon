'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const DEADLINE = process.env.NEXT_PUBLIC_SUBMISSION_DEADLINE || '2026-05-01T23:59:59+07:00'

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 })
      setTimeLeft({
        days:  Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins:  Math.floor((diff % 3600000) / 60000),
        secs:  Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return timeLeft
}

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div style={{ textAlign: 'center', minWidth: 90 }}>
    <div className="countdown-digit">{String(value).padStart(2, '0')}</div>
    <div className="countdown-label">{label}</div>
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

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 48px', borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(5,13,26,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
          GEOAI HACKATHON
        </span>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Challenges', 'Leaderboard', 'Docs', 'Support'].map(item => (
            <a key={item} href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              {item}
            </a>
          ))}
          <Link href="/login" className="btn btn-primary" style={{ padding: '8px 20px' }}>
            Register Now
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '100px 48px 80px', maxWidth: 960, margin: '0 auto', position: 'relative' }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)', boxShadow: 'var(--glow-cyan-sm)', animation: 'pulse-cyan 2s infinite' }} />
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>MISSION STARTED — 2026</span>
          </div>

          <h1 className="font-display" style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.05, marginBottom: 24, color: 'var(--text-primary)' }}>
            AGRI-DISASTER<br />
            <span style={{ color: 'var(--accent-cyan)', textShadow: 'var(--glow-cyan)' }}>AI HACKATHON</span>
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 560, lineHeight: 1.7, marginBottom: 40 }}>
            Harnessing hyperscaled AI data and orbital intelligence to build resilient agricultural ecosystems and rapid disaster response protocols for the next decade.
          </p>

          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/login" className="btn btn-primary" style={{ fontSize: 14, padding: '12px 28px' }}>
              ⚡ Continue with Google
            </Link>
            <a href="#timeline" className="btn btn-outline" style={{ fontSize: 14, padding: '12px 28px' }}>
              View Technical Docs
            </a>
          </div>
        </div>
      </section>

      {/* ── Countdown ── */}
      <section style={{ padding: '64px 48px', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 32 }}>
            SUBMISSION DEADLINE · PROTOCOL LOCK IN
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
            <TimeUnit value={days} label="DAYS" />
            <div style={{ color: 'var(--accent-cyan)', fontSize: 48, fontWeight: 300, alignSelf: 'flex-start', marginTop: 4 }}>:</div>
            <TimeUnit value={hours} label="HOURS" />
            <div style={{ color: 'var(--accent-cyan)', fontSize: 48, fontWeight: 300, alignSelf: 'flex-start', marginTop: 4 }}>:</div>
            <TimeUnit value={mins} label="MIN.SEC" />
            <div style={{ color: 'var(--accent-cyan)', fontSize: 48, fontWeight: 300, alignSelf: 'flex-start', marginTop: 4 }}>:</div>
            <TimeUnit value={secs} label="SECS" />
          </div>
        </div>
      </section>

      {/* ── Tracks ── */}
      <section style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>FOCUS TRACKS</div>
          <h2 className="font-display" style={{ fontSize: 36, marginBottom: 8 }}>Select Your Mission</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 48 }}>
            Your track defines the operational scope using the following intelligence.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {tracks.map(track => (
              <div key={track.id} className="track-card">
                <div style={{ fontSize: 36, marginBottom: 16 }}>{track.icon}</div>
                <h3 className="font-display" style={{ fontSize: 22, marginBottom: 8 }}>{track.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{track.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {track.tags.map(t => (
                    <span key={t} className="badge badge-draft">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section id="timeline" style={{ padding: '80px 48px', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>COMPETITION LIFECYCLE</div>
          <h2 className="font-display" style={{ fontSize: 36, marginBottom: 48 }}>Protocol Timeline</h2>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 11, top: 12, bottom: 12, width: 1, background: 'var(--border-subtle)' }} />
            {timeline.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, marginBottom: 36, position: 'relative' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: item.status === 'done' ? 'var(--accent-green)' : item.status === 'active' ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                  border: `2px solid ${item.status === 'upcoming' ? 'var(--border-subtle)' : 'transparent'}`,
                  boxShadow: item.status === 'active' ? 'var(--glow-cyan)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--bg-base)', zIndex: 1,
                }}>
                  {item.status === 'done' ? '✓' : null}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <div className="font-mono" style={{ fontSize: 10, color: item.status === 'active' ? 'var(--accent-cyan)' : 'var(--text-muted)', marginBottom: 4 }}>
                    {item.phase}
                  </div>
                  <div className="font-display" style={{ fontSize: 18, marginBottom: 4, color: item.status === 'upcoming' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 className="font-display" style={{ fontSize: 48, lineHeight: 1.1, marginBottom: 16 }}>
            READY TO<br />
            <span style={{ color: 'var(--accent-cyan)' }}>DEPLOY?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Join hundreds of researchers and developers in architecting a sustainable future through Geospatial AI.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ fontSize: 15, padding: '14px 40px' }}>
            Register Now
          </Link>
        </div>
      </section>

      {/* ── Footer / Sponsors ── */}
      <footer style={{ padding: '48px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap', marginBottom: 32 }}>
            {sponsors.map(s => (
              <span key={s} className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                {s}
              </span>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            © 2026 GEOAI HACKATHON · PRECISION LENS UI ·{' '}
            <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</a>
            {' · '}
            <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
