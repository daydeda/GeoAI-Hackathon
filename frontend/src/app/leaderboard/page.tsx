'use client'

import { useEffect, useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Trophy, PieChart as PieChartIcon } from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

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

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-lg border border-(--accent-red) bg-(--accent-red)/10 p-6 text-center">
          <h2 className="mb-2 font-display text-xl text-(--accent-red)">Transmission Error</h2>
          <p className="text-sm text-(--text-secondary)">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 btn btn-outline border-(--accent-red) text-(--accent-red) hover:bg-(--accent-red)/20"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const trackData = stats?.tracks || []
  const totalQualifiedTeams = stats?.totalQualified || 0

  return (
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
              <img 
                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/Finalist-Announcement.png`} 
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

        </div>

        {/* Global Stats Summary */}
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
      </div>
    </div>
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
