'use client'

import { useEffect, useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Trophy, PieChart as PieChartIcon, Camera, Award, X, ZoomIn } from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const RAW_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || ''
const BASE_PATH = RAW_BASE_PATH.startsWith('/') ? RAW_BASE_PATH : ''
const withBasePath = (assetPath: string) => `${BASE_PATH}${assetPath}`

const podiumImages = [
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
]

const specialImages = [
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

type LeaderboardStats = {
  totalUsers: number
  totalSubmissions: number
  totalQualified: number
  tracks: { name: string; count: number }[]
}

const COLORS = ['#00e5ff', '#ffa726', '#00e676', '#8b5cf6', '#ec4899', '#ef4444']

function LeaderboardContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [activeTab, setActiveTab] = useState<'podium' | 'special'>('podium')
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string; subtitle: string } | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API}/api/v1/leaderboard/stats`)
        if (!res.ok) throw new Error('Failed to load leaderboard statistics')
        const data = await res.json()
        if (active) setStats(data)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-(--accent-cyan)">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-(--accent-cyan) border-t-transparent" />
        <div className="font-mono text-xs tracking-widest uppercase">Syncing Leaderboard Data...</div>
      </div>
    )
  }



  const trackData = stats?.tracks || []
  const totalQualifiedTeams = stats?.totalQualified || 0

  return (
    <>
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-12 animate-fade-in">
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="relative mb-12 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2 rounded-full border border-(--accent-cyan)/30 bg-(--accent-cyan)/10 px-4 py-1">
              <Trophy size={14} className="text-(--accent-cyan)" />
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-(--accent-cyan) uppercase">
                Qualified Field Registry
              </span>
            </div>
            <h1 className="font-display text-4xl text-white sm:text-5xl md:text-6xl tracking-tight pr-0 lg:pr-48">
              Leaderboard <span className="text-(--accent-cyan)">Statistics</span>
            </h1>
            <p className="max-w-2xl text-sm text-(--text-secondary) sm:text-base">
              Detailed analytics for the top teams who have officially qualified for the next phase of the GeoAI Hackathon.
            </p>
            
            <div className="mt-6 lg:absolute lg:top-0 lg:right-0 w-full lg:w-auto">
              <div className="flex items-center justify-between lg:justify-start gap-4 lg:gap-6 rounded-xl border border-(--border-subtle) bg-(--bg-surface) p-4 lg:p-6 shadow-2xl">
                <div className="flex flex-col">
                  <span className="text-[9px] lg:text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">Status</span>
                  <span className="font-display text-lg lg:text-2xl text-(--accent-green)">LIVE_FEED</span>
                </div>
                <div className="h-10 w-px bg-(--border-subtle)" />
                <div className="flex flex-col text-right lg:text-left">
                  <span className="text-[9px] lg:text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">Qualified Teams</span>
                  <span className="font-display text-lg lg:text-2xl text-white">{totalQualifiedTeams}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Grid: Track Distribution & Summary */}
          <div className="mb-12">
            <div className="mb-12 flex justify-center px-4">
              <div className="w-full max-w-2xl relative overflow-hidden rounded-2xl border border-(--accent-cyan)/20 shadow-[0_0_60px_rgba(0,229,255,0.12)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={withBasePath('/Finalist-Announcement.png')} 
                  alt="Finalist Announcement" 
                  className="w-full h-auto block"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-(--bg-base)/20 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Announcements Section */}
            <div className="mb-12 max-w-3xl mx-auto space-y-8 rounded-2xl border border-(--border-subtle) bg-(--bg-surface)/50 p-8 backdrop-blur-sm shadow-xl">
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-(--text-secondary) sm:text-base">
                  โอกาสในการเรียนรู้สำหรับผู้สมัครทุกท่าน แม้การแข่งขันจะมีข้อจำกัดด้านจำนวนทีมที่ผ่านเข้ารอบ แต่คณะผู้จัดงานเล็งเห็นว่าไอเดียและความตั้งใจของทุกทีมมีคุณค่าอย่างยิ่ง เราจึงขอเชิญชวนผู้สมัครทุกคนเข้าร่วมกิจกรรมอบรมเชิงปฏิบัติการ <strong className="text-(--accent-cyan)">(Workshop) ออนไลน์พิเศษ</strong> เพื่อเติมเต็มทักษะด้าน AI ยุคใหม่ ซึ่งท่านสามารถนำไปปรับใช้กับการเรียน การทำงาน หรือการแข่งขันในเวทีอื่นๆ ได้อย่างดีเยี่ยม:
                </p>
                <ul className="space-y-3 pl-2">
                  <li className="flex gap-3 text-sm text-(--text-primary)">
                    <span className="text-(--accent-cyan)">•</span>
                    <span><strong className="text-white">หัวข้อการอบรม:</strong> การสร้างซอฟต์แวร์ด้วยการ Prompt (Vibe-coding), การพัฒนาระบบอัตโนมัติอัจฉริยะ (Agentic AI), การใช้งานระบบจัดการข้อมูลเชิงพื้นที่ Sphere และเทคนิคการนำเสนอผลงาน</span>
                  </li>
                  <li className="flex gap-3 text-sm text-(--text-primary)">
                    <span className="text-(--accent-cyan)">•</span>
                    <span><strong className="text-white">วันเวลา:</strong> วันจันทร์ที่ 18 พฤษภาคม 2569 เวลา 10:00 – 15:00 น.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-(--text-primary)">
                    <span className="text-(--accent-cyan)">•</span>
                    <span><strong className="text-white">รูปแบบ:</strong> เปิดให้เข้าชมแบบออนไลน์ผ่านช่องทางที่ประกาศในเว็บไซต์ <a href="https://cegs.kmitl.ac.th/geoai-2026" className="text-(--accent-cyan) hover:underline" target="_blank" rel="noreferrer">https://cegs.kmitl.ac.th/geoai-2026</a></span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-(--border-subtle) space-y-4">
                <h4 className="font-display text-lg text-white">สำหรับทีมที่ผ่านเข้ารอบ 10 ทีมสุดท้าย:</h4>
                <ul className="space-y-3 pl-2">
                  <li className="flex gap-3 text-sm text-(--text-primary)">
                    <span className="text-(--accent-cyan)">•</span>
                    <span>ให้ทีมที่ได้รับคัดเลือกส่งเอกสารยืนยันสิทธิ์อีกครั้ง <strong className="text-(--accent-cyan)">ภายในวันที่ 15 พฤษภาคม 2569 เวลา 16.00 น.</strong> ผ่านช่องทางในเว็บไซต์</span>
                  </li>
                  <li className="flex gap-3 text-sm text-(--text-primary)">
                    <span className="text-(--accent-cyan)">•</span>
                    <span>โปรดเตรียมตัวสำหรับการรายงานตัวและการพัฒนาผลงานต้นแบบตามรายชื่อสมาชิกที่ระบุไว้ในแบบเสนอโครงการ (Proposal) เท่านั้น</span>
                  </li>
                </ul>
              </div>
            </div>

            {stats && (
              <section className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6 max-w-2xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-display text-xl text-white flex items-center gap-2">
                    <PieChartIcon size={18} className="text-(--accent-cyan)" />
                    Track Distribution
                  </h3>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trackData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {trackData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontFamily: 'Inter',
                          fontSize: '12px'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        formatter={(value) => <span className="text-[11px] text-(--text-secondary) font-mono uppercase tracking-wider">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Gallery Section */}
            <section className="mt-16 mb-16 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              {/* Futuristic grid background decoration */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-(--border-subtle) pb-6">
                <div>
                  <div className="flex items-center gap-2 text-(--accent-cyan) mb-2">
                    <Camera size={16} />
                    <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase">Event Registry & Telemetry</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl text-white">
                    Atmosphere & <span className="text-(--accent-cyan)">Award Ceremony</span>
                  </h2>
                </div>
                
                {/* Category Selectors */}
                <div className="flex items-center gap-2 bg-(--bg-base) p-1 rounded-lg border border-(--border-subtle)">
                  <button
                    onClick={() => setActiveTab('podium')}
                    className={`px-4 py-2 text-xs font-mono tracking-wider font-semibold uppercase rounded transition-all ${
                      activeTab === 'podium'
                        ? 'bg-(--accent-cyan) text-(--bg-base) shadow-md'
                        : 'text-(--text-secondary) hover:text-white'
                    }`}
                  >
                    Winners Podium
                  </button>
                  <button
                    onClick={() => setActiveTab('special')}
                    className={`px-4 py-2 text-xs font-mono tracking-wider font-semibold uppercase rounded transition-all ${
                      activeTab === 'special'
                        ? 'bg-(--accent-cyan) text-(--bg-base) shadow-md'
                        : 'text-(--text-secondary) hover:text-white'
                    }`}
                  >
                    Special Awards & Overall
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'podium' ? podiumImages : specialImages).map((image, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-(--border-subtle) bg-(--bg-base) p-3 transition-all duration-300 hover:border-(--accent-cyan)/50 hover:shadow-[0_0_25px_rgba(0,229,255,0.15)] active:scale-[0.98]"
                  >
                    {/* Image Wrapper */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.src}
                        alt={image.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      
                      {/* Zoom indicator on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
                        <div className="rounded-full bg-(--accent-cyan) p-3 text-black shadow-lg">
                          <ZoomIn size={20} />
                        </div>
                      </div>

                      {/* Top-Right Badge */}
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-(--bg-surface)/90 border border-(--border-subtle) rounded text-[9px] font-mono font-bold tracking-widest text-(--accent-cyan) uppercase">
                        {image.tag}
                      </span>
                    </div>

                    {/* Text Description */}
                    <div className="mt-4 px-1 pb-1">
                      <h3 className="font-display text-base font-semibold text-white tracking-wide group-hover:text-(--accent-cyan) transition-colors">
                        {image.title}
                      </h3>
                      <p className="mt-1 text-xs text-(--text-secondary) truncate">
                        {image.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Global Stats Summary */}
          {stats && (
            <div className="mt-12">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6 text-center shadow-xl transition-all hover:border-(--accent-cyan)/50">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-(--text-muted) uppercase">Total Registered</span>
                  <span className="font-display text-3xl text-white sm:text-4xl">{stats?.totalUsers || 0}</span>
                </div>
                <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6 text-center shadow-xl transition-all hover:border-(--accent-cyan)/50">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-(--text-muted) uppercase">Proposals Sent</span>
                  <span className="font-display text-3xl text-white sm:text-4xl">{stats?.totalSubmissions || 0}</span>
                </div>
                <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6 text-center shadow-xl transition-all hover:border-(--accent-cyan)/50">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-(--text-muted) uppercase">Qualified Teams</span>
                  <span className="font-display text-3xl text-(--accent-cyan) sm:text-4xl">{totalQualifiedTeams}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-all duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-(--bg-surface) shadow-[0_0_85px_rgba(0,229,255,0.2)] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-(--border-subtle) px-6 py-4">
              <div className="flex items-center gap-2">
                <Award className="text-(--accent-cyan)" size={18} />
                <span className="font-display text-base font-bold text-white tracking-wide uppercase">
                  {selectedImage.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="rounded-full bg-white/5 p-2 text-(--text-secondary) hover:bg-white/10 hover:text-white transition-all active:scale-90"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Image and Detail */}
            <div className="flex flex-col items-center bg-black/60 p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-70px)]">
              <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-white/15 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  className="mx-auto max-h-[60vh] w-auto object-contain"
                />
              </div>
              <div className="mt-6 text-center max-w-xl">
                <p className="text-sm sm:text-base text-(--text-secondary) leading-relaxed">
                  {selectedImage.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function LeaderboardPage() {
  return (
    <AuthProvider>
      <AppShell>
        <LeaderboardContent />
      </AppShell>
    </AuthProvider>
  )
}
