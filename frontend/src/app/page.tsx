'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X, Zap, Trophy, Video, ChevronLeft, ChevronRight, Play, Pause, Camera, ExternalLink } from 'lucide-react'
import { useCompetitionPhases } from '@/hooks/useCompetitionPhases'
import { useAlert } from '@/contexts/AlertContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const RAW_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || ''
const BASE_PATH = RAW_BASE_PATH.startsWith('/') ? RAW_BASE_PATH : ''

const withBasePath = (assetPath: string) => `${BASE_PATH}${assetPath}`

type SessionUser = {
  fullName?: string
  email?: string
}

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
    <div className="countdown-digit text-2xl sm:text-3xl md:text-4xl font-display font-bold text-(--accent-cyan)">
      {String(value).padStart(2, '0')}
    </div>
    <div className="countdown-label font-mono text-[10px] sm:text-xs text-(--text-muted)">
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

const hostedBy = [
  { name: 'KMITL', href: 'https://www.kmitl.ac.th/en', logo: withBasePath('/logos/kmitl.svg') },
  { name: 'ESRI', href: 'https://www.esri.com', logo: withBasePath('/logos/esri.svg') },
  { name: 'GISTDA', href: 'https://www.gistda.or.th', logo: withBasePath('/logos/gistda.svg') },
  { name: 'KMUTT', href: 'https://www.kmutt.ac.th/en', logo: withBasePath('/logos/kmutt.svg') },
]

const sponsoredBy = [
  { name: 'ETDA', href: 'https://www.etda.or.th/en', logo: withBasePath('/logos/etda.svg') },
]

const navLinks = [
  { label: 'Challenges', href: '#timeline' },
  { label: 'Quick Guide', href: '#quick-guide' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Docs', href: '/docs' },
  { label: 'Contact Us', href: '/support' },
]

const sliderImages = [
  {
    title: 'บรรยากาศการแข่งขัน GeoAI Hackathon',
    subtitle: 'ภาพรวมบรรยากาศการระดมสมองและแลกเปลี่ยนความรู้ของผู้เข้าแข่งขัน',
    src: withBasePath('/atmospic/1st_pic.JPG'),
    tag: 'OVERVIEW',
  },
  {
    title: 'กิจกรรมแนะแนวเทคนิคและการให้คำปรึกษา',
    subtitle: 'ผู้เชี่ยวชาญร่วมแบ่งปันประสบการณ์และให้คำปรึกษาแก่ผู้เข้าแข่งขันแต่ละทีมอย่างเป็นกันเอง',
    src: withBasePath('/atmospic/2nd_pic.JPG'),
    tag: 'OVERVIEW',
  },
  {
    title: 'การนำเสนอผลงานรอบสุดท้ายและการตัดสิน',
    subtitle: 'ผู้เข้าแข่งขันนำเสนอสุดยอดโมเดลและไอเดียต่อหน้าคณะกรรมการผู้ทรงคุณวุฒิ',
    src: withBasePath('/atmospic/3rd_pic.JPG'),
    tag: 'OVERVIEW',
  },
  {
    title: 'รางวัลชนะเลิศ (Champion)',
    subtitle: 'สุดยอดผลงานผู้คว้ารางวัลชนะเลิศในเวที GeoAI Hackathon 2026',
    src: withBasePath('/atmospic/01_runnerup.JPG'),
    tag: 'CHAMPION',
  },
  {
    title: 'รางวัลรองชนะเลิศอันดับ 1 (1st Runner-up)',
    subtitle: 'ผลงานดีเด่นที่ได้รับรางวัลรองชนะเลิศอันดับ 1',
    src: withBasePath('/atmospic/02_runnerup.JPG'),
    tag: 'RUNNER-UP',
  },
  {
    title: 'รางวัลรองชนะเลิศอันดับ 2 (2nd Runner-up)',
    subtitle: 'ผลงานดีเด่นที่ได้รับรางวัลรองชนะเลิศอันดับ 2',
    src: withBasePath('/atmospic/03_runnerup.JPG'),
    tag: 'RUNNER-UP',
  },
  {
    title: 'รางวัลการนำเสนอข้อมูลดีเด่น (Best Visualization)',
    subtitle: 'รางวัลสำหรับทีมที่แสดงผลข้อมูลเชิงพื้นที่ได้อย่างยอดเยี่ยมและสร้างสรรค์',
    src: withBasePath('/atmospic/04_BestVisualization.JPG'),
    tag: 'SPECIAL AWARD',
  },
  {
    title: 'รางวัลสุดยอดโมเดลปัญญาประดิษฐ์ (Best AI Model)',
    subtitle: 'รางวัลสำหรับทีมที่ออกแบบการทำงานของระบบ AI และเทคนิคการเรียนรู้เชิงลึกได้ยอดเยี่ยมที่สุด',
    src: withBasePath('/atmospic/05_BestAI.JPG'),
    tag: 'SPECIAL AWARD',
  },
  {
    title: 'ภาพประทับใจร่วมกันของทุกคน',
    subtitle: 'ภาพถ่ายหมู่รวมผู้เข้าแข่งขัน คณะผู้จัดงาน และคณะกรรมการผู้ทรงคุณวุฒิทุกท่านในวันปิดงาน',
    src: withBasePath('/atmospic/overall.JPG'),
    tag: 'OVERALL',
  },
]

export default function LandingPage() {
  const { currentPhase, timeline } = useCompetitionPhases()
  const { days, hours, mins, secs } = useCountdown(currentPhase.date)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [trainingModalOpen, setTrainingModalOpen] = useState(false)
  const { showAlert } = useAlert()

  const handleDriveClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    showAlert('ระบบกำลังดำเนินการอัปโหลดไฟล์รูปภาพเพิ่มเติมไปยัง Google Drive กรุณากลับมาตรวจสอบใหม่อีกครั้งในภายหลัง', 'info')
  }

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length)
  }

  useEffect(() => {
    let active = true

    const fetchSession = async () => {
      try {
        const response = await fetch(`${API}/api/v1/auth/me`, { credentials: 'include' })
        if (!response.ok) {
          if (active) setSessionUser(null)
          return
        }

        const payload = (await response.json()) as SessionUser
        if (active) setSessionUser(payload)
      } catch {
        if (active) setSessionUser(null)
      }
    }

    fetchSession()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-(--bg-base) overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-(--border-subtle) bg-[rgba(5,13,26,0.95)] backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-display text-base sm:text-lg md:text-xl font-bold text-(--accent-cyan) tracking-widest">
            GeoAI HACKATHON 2026
          </span>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xs sm:text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
            {sessionUser ? (
              <div className="flex items-center gap-3">
                <div className="max-w-[220px] truncate rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-xs text-(--text-secondary)">
                  {sessionUser.fullName || sessionUser.email || 'Authenticated User'}
                </div>
                <Link href="/dashboard" className="px-4 sm:px-6 py-2 sm:py-2.5 bg-(--accent-cyan) text-(--bg-base) rounded font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity">
                  Open Dashboard
                </Link>
              </div>
            ) : (
              <Link href="/login" className="px-4 sm:px-6 py-2 sm:py-2.5 bg-(--accent-cyan) text-(--bg-base) rounded font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity">
                Register Now
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-(--border-subtle) text-(--text-secondary)"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-3 border-t border-(--border-subtle) pt-4">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block px-4 py-2 text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors"
              >
                {item.label}
              </Link>
            ))}
            {sessionUser ? (
              <>
                <div className="px-4 py-2 text-sm text-(--text-secondary)">
                  Signed in as {sessionUser.fullName || sessionUser.email || 'Authenticated User'}
                </div>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 bg-(--accent-cyan) text-(--bg-base) rounded font-semibold text-sm text-center hover:opacity-90 transition-opacity"
                >
                  Open Dashboard
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="block px-4 py-2 bg-(--accent-cyan) text-(--bg-base) rounded font-semibold text-sm text-center hover:opacity-90 transition-opacity"
              >
                Register Now
              </Link>
            )}
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
            <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-(--accent-cyan) animate-pulse" />
            <span className="font-mono text-[10px] sm:text-xs text-(--text-muted) tracking-widest">
              MISSION STARTED — 2026
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 sm:mb-6 text-(--text-primary)">
            GEOSPATIAL INTELLIGENCE <br /> FOR RESILIENCE
            <br />
            <span className="text-(--accent-cyan)" style={{ textShadow: 'var(--glow-cyan)' }}>
              HACKATHON
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-(--text-secondary) max-w-2xl leading-relaxed mb-8 sm:mb-12">
            Harnessing hyperscaled AI data and orbital intelligence to build resilient agricultural ecosystems and rapid disaster response protocols for the next decade.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <Link
              href={sessionUser ? '/dashboard' : '/login'}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-(--accent-cyan) text-(--bg-base) rounded font-semibold text-sm sm:text-base hover:opacity-90 transition-all active:scale-95 w-full sm:w-auto"
            >
              <Zap size={18} />
              {sessionUser ? 'Go to Dashboard' : 'Continue with Google'}
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded font-semibold text-sm sm:text-base bg-[#FFA500] text-black hover:opacity-90 transition-colors w-full sm:w-auto"
            >
              รายละเอียดการแข่งขัน
            </Link>
            <button
              onClick={() => setTrainingModalOpen(true)}
              className="relative inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded font-semibold text-sm sm:text-base bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#be123c] text-white hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(244,63,94,0.5)] hover:shadow-[0_0_30px_rgba(244,63,94,0.85)] animate-pulse w-full sm:w-auto overflow-hidden group border border-[#f43f5e]/30"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#f43f5e] via-[#db2777] to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <Video size={18} />
                <span className="font-bold tracking-wide">Live Training Session</span>
              </span>
            </button>
            <Link
              href="/leaderboard"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded font-semibold text-sm sm:text-base border border-(--accent-cyan) text-(--accent-cyan) hover:bg-(--accent-cyan)/10 transition-colors w-full sm:w-auto"
            >
              <Trophy size={18} />
              ประกาศรายชื่อทีมที่เข้ารอบ
            </Link>
          </div>
        </div>
      </section>

      {/* ── Event Atmosphere Showcase (Auto-playing Slider) ── */}
      <section className="border-t border-b border-(--border-subtle) bg-(--bg-surface) px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-(--accent-cyan) mb-2">
              <Camera size={14} className="animate-pulse" />
              <span className="font-mono text-[10px] sm:text-xs tracking-[0.25em] uppercase">
                COHORT MISSION RECAP & REGISTRY
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              GeoAI Hackathon 2026 Atmosphere
            </h2>
            <p className="text-sm text-(--text-secondary) max-w-2xl mx-auto mt-2">
              ร่วมสัมผัสภาพบรรยากาศการแข่งขันจริงและพิธีมอบรางวัลของเหล่าผู้เข้าร่วมโครงการ GeoAI Hackathon ในหัวข้อ Smart Agriculture และ Disaster & Flood Response
            </p>
          </div>

          {/* Slider Container */}
          <div 
            className="relative group overflow-hidden rounded-2xl border border-(--border-subtle) bg-(--bg-base) p-3 transition-all duration-300 hover:border-(--accent-cyan)/40 hover:shadow-[0_0_50px_rgba(0,229,255,0.1)]"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Aspect Ratio Box with absolute contain to show full picture without cropping */}
            <div className="relative w-full h-[280px] sm:h-[380px] md:h-[480px] lg:h-[540px] rounded-xl bg-black/60 overflow-hidden flex items-center justify-center">
              {/* Image with object-contain to preserve original full dimensions */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sliderImages[currentSlide].src}
                alt={sliderImages[currentSlide].title}
                className="max-w-full max-h-full w-auto h-auto object-contain select-none transition-opacity duration-500"
              />

              {/* Gradient overlay on bottom */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

              {/* Telemetry frame decoration (Top Left) */}
              <div className="absolute top-4 left-4 font-mono text-[9px] text-(--accent-cyan) tracking-wider bg-(--bg-base)/80 px-2.5 py-1 rounded border border-(--border-subtle) backdrop-blur-sm">
                FRAME: {String(currentSlide + 1).padStart(2, '0')} / {String(sliderImages.length).padStart(2, '0')}
              </div>

              {/* Telemetry Badge (Top Right) */}
              <div className="absolute top-4 right-4 font-mono text-[9px] text-white font-bold tracking-widest bg-(--accent-cyan) text-black px-2 py-0.5 rounded uppercase">
                {sliderImages[currentSlide].tag}
              </div>

              {/* Slide Caption (Bottom Left) */}
              <div className="absolute bottom-4 left-4 right-16 text-left z-10 pointer-events-none">
                <p className="text-base sm:text-lg md:text-xl font-display font-bold text-white tracking-wide">
                  {sliderImages[currentSlide].title}
                </p>
                <p className="text-xs sm:text-sm text-(--text-secondary) mt-0.5">
                  {sliderImages[currentSlide].subtitle}
                </p>
              </div>

              {/* AutoPlay Status Indicator (Bottom Right) */}
              <button 
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="absolute bottom-4 right-4 z-20 flex items-center justify-center p-2 rounded-full border border-(--border-subtle) bg-(--bg-surface)/80 text-(--text-secondary) hover:text-white hover:bg-(--bg-elevated) transition-all pointer-events-auto"
                aria-label={isAutoPlaying ? "Pause autoplay" : "Start autoplay"}
              >
                {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>

            {/* Left Control Arrow */}
            <button
              onClick={prevSlide}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-(--border-subtle) bg-(--bg-surface)/90 text-(--text-secondary) opacity-0 group-hover:opacity-100 transition-all hover:border-(--accent-cyan) hover:text-(--accent-cyan) hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] active:scale-90"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
            </button>

            {/* Right Control Arrow */}
            <button
              onClick={nextSlide}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-(--border-subtle) bg-(--bg-surface)/90 text-(--text-secondary) opacity-0 group-hover:opacity-100 transition-all hover:border-(--accent-cyan) hover:text-(--accent-cyan) hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] active:scale-90"
              aria-label="Next slide"
            >
              <ChevronRight size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-4">
            {sliderImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx 
                    ? 'w-6 bg-(--accent-cyan)' 
                    : 'w-1.5 bg-(--text-muted) hover:bg-(--text-secondary)'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* External Google Drive Link Button */}
          <div className="flex justify-center mt-8">
            <a
              href="#"
              onClick={handleDriveClick}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-(--border-subtle) bg-(--bg-surface)/40 text-(--text-muted) hover:text-(--text-secondary) hover:border-(--border-subtle) hover:bg-(--bg-elevated)/50 transition-all text-sm font-semibold active:scale-95 cursor-not-allowed shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
            >
              <span>คลิ๊กที่นี่เพื่อดูรูปทั้งหมด</span>
              <ExternalLink size={14} className="opacity-40" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Countdown ── */}
      <section className="border-t border-(--border-subtle) bg-[rgba(0,229,255,0.02)] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="font-mono text-[10px] sm:text-xs text-(--text-muted) tracking-widest mb-3">SPONSORED BY</div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {sponsoredBy.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 hover:opacity-80"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sponsor.logo} alt={`${sponsor.name} logo`} className="h-5 w-auto" />
                <span className="font-display text-base sm:text-lg font-bold text-(--accent-cyan) tracking-widest">{sponsor.name}</span>
              </a>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-[315px] aspect-[9/16] w-full overflow-hidden rounded-xl border border-(--border-subtle) shadow-[0_0_40px_rgba(0,229,255,0.1)]">
            <iframe
              src="https://www.youtube.com/embed/gTkqaq08C4U"
              title="YouTube shorts player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-b border-(--border-subtle) bg-(--bg-surface) px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="font-mono text-[10px] sm:text-xs text-(--text-muted) tracking-widest mb-2 uppercase">
              {currentPhase.key === 'proposal-submission' 
                ? 'SUBMISSION DEADLINE · PROTOCOL LOCK IN' 
                : currentPhase.key === 'announcement'
                ? 'ANNOUNCEMENT PHASE · PREPARING FINALISTS'
                : `${currentPhase.title} · PROTOCOL PHASE`}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
            <TimeUnit value={days} label="DAYS" />
            <span className="text-2xl sm:text-3xl md:text-4xl text-(--accent-cyan) font-light">:</span>
            <TimeUnit value={hours} label="HOURS" />
            <span className="text-2xl sm:text-3xl md:text-4xl text-(--accent-cyan) font-light">:</span>
            <TimeUnit value={mins} label="MINS" />
            <span className="text-2xl sm:text-3xl md:text-4xl text-(--accent-cyan) font-light">:</span>
            <TimeUnit value={secs} label="SECS" />
          </div>
        </div>
      </section>

      {/* ── Tracks ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="font-mono text-[10px] sm:text-xs text-(--text-muted) tracking-widest mb-2">
              FOCUS TRACKS
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Select Your Mission
            </h2>
            <p className="text-sm sm:text-base text-(--text-secondary) max-w-2xl">
              Your track defines the operational scope using the following intelligence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {tracks.map(track => (
              <div
                key={track.id}
                className="p-6 sm:p-8 rounded-lg border border-(--border-subtle) bg-(--bg-surface) hover:border-(--border-active) transition-colors"
              >
                <div className="text-4xl sm:text-5xl mb-4">
                  {track.icon}
                </div>
                <h3 className="font-display text-xl sm:text-2xl mb-3 sm:mb-4 text-(--text-primary)">
                  {track.title}
                </h3>
                <p className="text-sm sm:text-base text-(--text-secondary) leading-relaxed mb-4 sm:mb-6">
                  {track.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {track.tags.map(t => (
                    <span
                      key={t}
                      className="inline-block px-2 sm:px-3 py-1 bg-(--bg-base) text-(--accent-cyan) text-xs font-mono rounded"
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

      {/* ── Quick Guide ── */}
      <section id="quick-guide" className="border-t border-b border-(--border-subtle) bg-(--bg-surface) px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 sm:mb-10">
            <div className="font-mono text-[10px] sm:text-xs text-(--text-muted) tracking-widest mb-2">
              QUICK SUBMISSION GUIDE
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-(--text-primary)">
              Submit Your Proposal In 5 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {[
              {
                step: '01',
                title: 'Sign-in with Google',
                desc: 'เริ่มต้นด้วยการ "Continue with Google" จากนั้นกรอกข้อมูลโปรไฟล์และการตั้งค่าทีมของคุณให้เรียบร้อย',
              },
              {
                step: '02',
                title: 'Create or Join a Team',
                desc: 'เลือกหัวข้อของคุณที่ต้องการจะส่ง เชิญเพื่อนร่วมทีม และตรวจสอบรายละเอียดของสมาชิกทุกคนให้ครบถ้วน',
              },
              {
                step: '03',
                title: 'Prepare Submission PDF',
                desc: 'อัปโหลด Proposal ของคุณในรูปแบบไฟล์ PDF ผ่านช่องทางการส่งงาน (Submission) ให้เรียบร้อยก่อนครบกำหนดเวลา',
              },
              {
                step: '04',
                title: 'Check GISTDA Declaration',
                desc: 'กดยอมรับปฏิญญา Sphere of GISTDA และบันทึกข้อมูลการส่ง Proposal ของคุณ',
              },
              {
                step: '05',
                title: 'Verify Status',
                desc: 'ติดตามความคืบหน้าการตรวจทานได้จากแดชบอร์ดของคุณ และสามารถอัปเดต Proposal ใหม่ได้',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-(--border-subtle) bg-(--bg-base) p-5 sm:p-6"
              >
                <div className="font-mono text-xs tracking-widest text-(--accent-cyan) mb-2">STEP {item.step}</div>
                <h3 className="font-display text-lg sm:text-xl text-(--text-primary) mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base text-(--text-secondary) leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section id="timeline" className="bg-(--bg-surface) px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 sm:mb-12">
            <div className="font-mono text-[10px] sm:text-xs text-(--text-muted) tracking-widest mb-2">
              COMPETITION LIFECYCLE
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              Protocol Timeline
            </h2>
          </div>

          <div className="space-y-6 sm:space-y-8 relative">
            {/* Vertical line */}
            <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-(--border-subtle)" />

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

                <div className={item.status === 'done' ? 'opacity-40' : ''}>
                  <div
                    className={`font-mono text-xs sm:text-sm mb-1 tracking-widest ${item.status === 'done' ? 'line-through' : ''}`}
                    style={{
                      color:
                        item.status === 'active'
                          ? 'var(--accent-cyan)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {item.phase} · {item.dateLabel}
                  </div>
                  <h3 className={`font-display text-lg sm:text-xl mb-2 ${item.status === 'done' ? 'line-through' : ''}`} style={{
                    color: item.status === 'upcoming' ? 'var(--text-secondary)' : 'var(--text-primary)',
                  }}>
                    {item.title}
                  </h3>
                  <p className={`text-sm sm:text-base text-(--text-muted) leading-relaxed ${item.status === 'done' ? 'line-through' : ''}`}>
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
            <span className="text-(--accent-cyan)">DEPLOY?</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-(--text-secondary) leading-relaxed mb-8 sm:mb-12 max-w-2xl mx-auto">
            Join hundreds of researchers and developers in architecting a sustainable future through Geospatial AI.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-(--accent-cyan) text-(--bg-base) rounded font-semibold text-sm sm:text-base hover:opacity-90 transition-all active:scale-95"
          >
            <Zap size={18} />
            Register Now
          </Link>
        </div>
      </section>

      {/* ── Footer / Sponsors ── */}
      <footer className="border-t border-(--border-subtle) bg-(--bg-surface) px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4 font-mono text-[10px] sm:text-xs text-(--text-muted) tracking-widest">
            HOSTED BY
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 lg:gap-12 mb-8">
            {hostedBy.map((institution) => (
              <a
                key={institution.name}
                href={institution.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 hover:border-(--border-active) transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={institution.logo} alt={`${institution.name} logo`} className="h-5 w-auto" />
                <span className="font-display text-sm sm:text-base md:text-lg font-bold text-(--text-muted) tracking-widest hover:text-(--text-primary)">
                  {institution.name}
                </span>
              </a>
            ))}
          </div>
          <div className="text-center text-xs sm:text-sm text-(--text-muted)">
            © 2026 GEOAI HACKATHON · {' '}
          </div>
        </div>
      </footer>

      {/* Training Session Modal */}
      {trainingModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md transition-all duration-300"
          onClick={() => setTrainingModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 bg-(--bg-surface) p-5 sm:p-8 shadow-[0_0_80px_rgba(0,229,255,0.25)] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Glow effect */}
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-(--accent-cyan)/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header / Close */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-(--accent-cyan) animate-pulse" />
                <span className="font-display text-base sm:text-lg font-bold text-white tracking-wide">
                  Training & Technical Briefing
                </span>
              </div>
              <button
                onClick={() => setTrainingModalOpen(false)}
                className="rounded-full bg-white/5 p-2 text-(--text-muted) hover:bg-white/10 hover:text-white transition-all active:scale-90"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content: Poster & Info */}
            <div className="space-y-6 relative z-10">
              <p className="text-xs sm:text-sm text-(--text-secondary) leading-relaxed">
                คลิกที่รูปภาพโปสเตอร์หรือปุ่มด้านล่าง เพื่อเข้าสู่ลิงก์บันทึกวิดีโอการอบรมพิเศษและชี้แจงโจทย์ทางเทคนิค (Technical Briefing)
              </p>

              {/* Clickable Poster */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 shadow-2xl transition-all hover:shadow-[0_0_40px_rgba(0,229,255,0.2)] hover:border-(--accent-cyan)/30 group max-w-2xl mx-auto bg-black/40">
                <a 
                  href="https://www.youtube.com/watch?v=J7TPXFmkmGc" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full h-auto relative"
                >
                  <img 
                    src={withBasePath('/train-session.png')} 
                    alt="Training Session Poster" 
                    className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.01]" 
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-(--accent-cyan) text-black font-bold px-5 py-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <Zap size={16} />
                      คลิกเพื่อรับชมผ่าน YouTube
                    </div>
                  </div>
                </a>
              </div>

              {/* Direct A-Href Link */}
              <div className="text-center pt-2">
                <a 
                  href="https://www.youtube.com/watch?v=J7TPXFmkmGc" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-(--accent-cyan) hover:text-white transition-colors underline underline-offset-4 font-medium"
                >
                  <Zap size={14} className="animate-bounce" />
                  คลิกที่นี่เพื่อรับชม: Technical Briefing & Training Session (YouTube Live)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
