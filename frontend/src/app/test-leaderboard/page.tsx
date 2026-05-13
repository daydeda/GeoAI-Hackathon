'use client'

import { useEffect, useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Trophy, Users, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import Image from 'next/image'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type LeaderboardStats = {
  universities: {
    byTeams: { name: string; count: number }[]
    byUsers: { name: string; count: number }[]
  }
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
  const uniTeamsData = (stats?.universities.byTeams || []).slice(0, 10)
  const uniUsersData = (stats?.universities.byUsers || []).slice(0, 10)

  const totalQualifiedTeams = trackData.reduce((acc, curr) => acc + curr.count, 0)

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

        {/* Bottom Grid: University Charts */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* University by Teams */}
          <section className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6 sm:p-8 transition-all hover:shadow-[0_0_40px_rgba(0,229,255,0.05)]">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl text-white">Top Institutions</h3>
                <p className="text-[11px] text-(--text-muted) font-mono tracking-wider uppercase">by Total Team Count</p>
              </div>
              <BarChart3 size={24} className="text-(--accent-cyan) opacity-50" />
            </div>
            
            <div style={{ height: Math.max(300, uniTeamsData.length * 45) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={uniTeamsData} layout="vertical" margin={{ left: 40, right: 30 }}>
                  <defs>
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--accent-cyan-dim)" />
                      <stop offset="100%" stopColor="var(--accent-cyan)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}
                    width={110}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,229,255,0.04)' }}
                    contentStyle={{ 
                      background: 'var(--bg-base)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px' 
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [`${v} Teams`, 'Qualified Teams']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#cyanGradient)" 
                    radius={[0, 4, 4, 0]} 
                    maxBarSize={28}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* University by Individuals */}
          <section className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6 sm:p-8 transition-all hover:shadow-[0_0_40px_rgba(255,167,38,0.05)]">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl text-white">Member Concentration</h3>
                <p className="text-[11px] text-(--text-muted) font-mono tracking-wider uppercase">by Individual Participant Count</p>
              </div>
              <Users size={24} className="text-(--accent-amber) opacity-50" />
            </div>
            
            <div style={{ height: Math.max(300, uniUsersData.length * 45) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={uniUsersData} layout="vertical" margin={{ left: 40, right: 30 }}>
                  <defs>
                    <linearGradient id="amberGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#b45309" />
                      <stop offset="100%" stopColor="var(--accent-amber)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}
                    width={110}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,167,38,0.04)' }}
                    contentStyle={{ 
                      background: 'var(--bg-base)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px' 
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [`${v} Members`, 'Qualified Participants']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#amberGradient)" 
                    radius={[0, 4, 4, 0]} 
                    maxBarSize={28}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
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
