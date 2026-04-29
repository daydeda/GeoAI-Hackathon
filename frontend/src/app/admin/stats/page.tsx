'use client'

import { useEffect, useMemo, useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Activity, BarChart3, Users, FileText, UserPlus } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type StatsPoint = {
  date: string
  registrations: number
  submissions: number
  teams: number
}

type StatsResponse = {
  days: number
  from: string
  to: string
  totals: {
    registrations: number
    submissions: number
    teams: number
  }
  series: StatsPoint[]
}

type FilterMode = 'OVERVIEW' | 'MONTH' | 'DAY'

function formatShortDate(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

type CompetitorStats = {
  universities: {
    byTeams: { name: string; count: number }[]
    byUsers: { name: string; count: number }[]
  }
  yearOfStudy: { year: number; count: number }[]
  tracks: { name: string; count: number }[]
  teamStatus: { status: string; count: number }[]
  competitorStatus: { status: string; count: number }[]
}

function StatsContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [compStats, setCompStats] = useState<CompetitorStats | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>('OVERVIEW')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedDay, setSelectedDay] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const opts = { credentials: 'include' } as const
        const [overviewRes, compRes] = await Promise.all([
          fetch(`${API}/api/v1/admin/stats/overview?days=365`, opts),
          fetch(`${API}/api/v1/admin/stats/competitors`, opts),
        ])

        if (!overviewRes.ok) throw new Error('Failed to load overview stats')
        if (!compRes.ok) throw new Error('Failed to load competitor stats')

        const overviewData = await overviewRes.json()
        const compData = await compRes.json()

        if (active) {
          setStats(overviewData)
          setCompStats(compData)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load stats')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  const chartData = useMemo(
    () =>
      (stats?.series || []).map((row) => ({
        ...row,
        label: formatShortDate(row.date),
      })),
    [stats?.series],
  )

  const availableMonths = useMemo(() => {
    const months = Array.from(new Set((stats?.series || []).map((row) => row.date.slice(0, 7))))
    return months.sort((a, b) => a.localeCompare(b))
  }, [stats?.series])

  const availableDays = useMemo(() => {
    if (!selectedMonth) return [] as string[]
    return (stats?.series || [])
      .filter((row) => row.date.startsWith(selectedMonth))
      .map((row) => row.date)
      .sort((a, b) => a.localeCompare(b))
  }, [selectedMonth, stats?.series])

  useEffect(() => {
    if (availableMonths.length === 0) return
    if (!selectedMonth || !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[availableMonths.length - 1])
    }
  }, [availableMonths, selectedMonth])

  useEffect(() => {
    if (availableDays.length === 0) {
      if (selectedDay) setSelectedDay('')
      return
    }
    if (!selectedDay || !availableDays.includes(selectedDay)) {
      setSelectedDay(availableDays[availableDays.length - 1])
    }
  }, [availableDays, selectedDay])

  const filteredChartData = useMemo(() => {
    if (filterMode === 'MONTH' && selectedMonth) {
      return chartData.filter((row) => row.date.startsWith(selectedMonth))
    }

    if (filterMode === 'DAY' && selectedDay) {
      return chartData.filter((row) => row.date === selectedDay)
    }

    return chartData
  }, [chartData, filterMode, selectedDay, selectedMonth])

  const totals = useMemo(
    () => ({
      registrations: filteredChartData.reduce((acc, row) => acc + row.registrations, 0),
      submissions: filteredChartData.reduce((acc, row) => acc + row.submissions, 0),
      teams: filteredChartData.reduce((acc, row) => acc + row.teams, 0),
    }),
    [filteredChartData],
  )

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3">
          <div className="font-mono flex items-center gap-2 text-[11px] tracking-[0.1em] text-(--accent-green)">
            <Activity size={12} />
            <span>ANALYTICS TELEMETRY</span>
          </div>
          <h1 className="font-display text-3xl text-white sm:text-4xl md:text-5xl">Stats Overview</h1>
          <p className="text-xs text-(--text-muted) sm:text-sm">
            Filter registrations, submissions, and team-creation trends by overview, month, or day.
          </p>
        </div>

        <div className="mb-6 rounded border border-(--border-subtle) bg-(--bg-surface) p-4">
          <div className="mb-3 text-xs font-semibold tracking-[0.08em] text-(--text-muted)">FILTER MODE</div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              {(['OVERVIEW', 'MONTH', 'DAY'] as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`rounded border px-3 py-1.5 text-xs font-semibold tracking-[0.05em] transition-colors ${
                    filterMode === mode
                      ? 'border-(--accent-cyan) bg-[rgba(0,229,255,0.12)] text-(--accent-cyan)'
                      : 'border-(--border-subtle) text-(--text-secondary) hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {filterMode === 'MONTH' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-xs text-white outline-none"
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            )}

            {filterMode === 'DAY' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-xs text-white outline-none"
                >
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-xs text-white outline-none"
                >
                  {availableDays.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded border border-(--accent-red) bg-[rgba(255,23,68,0.08)] px-4 py-3 text-sm text-(--accent-red)">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded border border-(--border-subtle) bg-(--bg-surface) p-4">
            <div className="mb-2 inline-flex items-center gap-2 text-xs text-(--text-muted)">
              <UserPlus size={14} />
              USER REGISTRATIONS
            </div>
            <div className="font-display text-3xl text-(--accent-cyan)">
              {totals.registrations}
            </div>
          </div>

          <div className="rounded border border-(--border-subtle) bg-(--bg-surface) p-4">
            <div className="mb-2 inline-flex items-center gap-2 text-xs text-(--text-muted)">
              <FileText size={14} />
              PROPOSAL SUBMISSIONS
            </div>
            <div className="font-display text-3xl text-(--accent-amber)">
              {totals.submissions}
            </div>
          </div>

          <div className="rounded border border-(--border-subtle) bg-(--bg-surface) p-4">
            <div className="mb-2 inline-flex items-center gap-2 text-xs text-(--text-muted)">
              <Users size={14} />
              TEAM CREATIONS
            </div>
            <div className="font-display text-3xl text-(--accent-green)">
              {totals.teams}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <section className="rounded border border-(--border-subtle) bg-(--bg-surface) p-4 sm:p-6">
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
              <BarChart3 size={16} className="text-(--accent-cyan)" />
              User Registration Trends
            </div>
            <div className="h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredChartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Area type="monotone" dataKey="registrations" stroke="var(--accent-cyan)" fill="rgba(0,229,255,0.25)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded border border-(--border-subtle) bg-(--bg-surface) p-4 sm:p-6">
            <div className="mb-4 text-sm font-semibold text-white">Proposal Submission Volume</div>
            <div className="h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredChartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Bar dataKey="submissions" fill="var(--accent-amber)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded border border-(--border-subtle) bg-(--bg-surface) p-4 sm:p-6">
            <div className="mb-4 text-sm font-semibold text-white">Team Creation Counts</div>
            <div className="h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="teams" stroke="var(--accent-green)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Competitor Distribution Section */}
        {compStats && (
          <div className="mt-12">
            <div className="mb-8 flex flex-col gap-1">
              <div className="font-mono flex items-center gap-2 text-[11px] tracking-[0.1em] text-(--accent-amber)">
                <Users size={12} />
                <span>COMPETITOR ANALYTICS</span>
              </div>
              <h2 className="font-display text-2xl text-white sm:text-3xl">Competitor Distribution</h2>
              <p className="text-xs text-(--text-muted) sm:text-sm">
                Breakdown of participants by institution, academic year, track, and status.
              </p>
            </div>

            {/* University Charts — full width, stacked */}
            <div className="mb-6 flex flex-col gap-6">
              {/* University by Teams */}
              <section className="rounded border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
                <div className="mb-1 text-sm font-semibold text-white">Top Institutions — by Team Count</div>
                <div className="mb-4 text-[11px] text-(--text-muted)">Number of registered teams per institution</div>
                {compStats.universities.byTeams.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-sm text-(--text-muted)">No data available</div>
                ) : (
                  <div style={{ height: Math.max(220, compStats.universities.byTeams.slice(0, 15).length * 36) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={compStats.universities.byTeams.slice(0, 15)}
                        layout="vertical"
                        margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" horizontal={false} vertical={true} />
                        <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                          width={200}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          contentStyle={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                          formatter={(v: number) => [`${v} teams`, 'Count']}
                        />
                        <Bar dataKey="count" fill="var(--accent-cyan)" radius={[0, 4, 4, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              {/* University by Individuals */}
              <section className="rounded border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
                <div className="mb-1 text-sm font-semibold text-white">Top Institutions — by Individual Count</div>
                <div className="mb-4 text-[11px] text-(--text-muted)">Total unique competitors (members + leaders) per institution</div>
                {compStats.universities.byUsers.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-sm text-(--text-muted)">No data available</div>
                ) : (
                  <div style={{ height: Math.max(220, compStats.universities.byUsers.slice(0, 15).length * 36) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={compStats.universities.byUsers.slice(0, 15)}
                        layout="vertical"
                        margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" horizontal={false} vertical={true} />
                        <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                          width={200}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          contentStyle={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                          formatter={(v: number) => [`${v} people`, 'Count']}
                        />
                        <Bar dataKey="count" fill="var(--accent-amber)" radius={[0, 4, 4, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            </div>

            {/* 2-column charts */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Year of Study */}
              <section className="rounded border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
                <div className="mb-1 text-sm font-semibold text-white">Year of Study</div>
                <div className="mb-4 text-[11px] text-(--text-muted)">Competitor count per academic year (verified role only)</div>
                {compStats.yearOfStudy.length === 0 ? (
                  <div className="flex h-[240px] items-center justify-center text-sm text-(--text-muted)">No data available</div>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compStats.yearOfStudy} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Year', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          contentStyle={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                          formatter={(v: number) => [`${v} people`, 'Competitors']}
                        />
                        <Bar dataKey="count" fill="var(--accent-green)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              {/* Track Distribution */}
              <section className="rounded border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
                <div className="mb-1 text-sm font-semibold text-white">Track Distribution</div>
                <div className="mb-4 text-[11px] text-(--text-muted)">Number of teams registered per competition track</div>
                {compStats.tracks.length === 0 ? (
                  <div className="flex h-[240px] items-center justify-center text-sm text-(--text-muted)">No data available</div>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compStats.tracks} margin={{ top: 4, right: 16, left: 0, bottom: 16 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          contentStyle={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                          formatter={(v: number) => [`${v} teams`, 'Count']}
                        />
                        <Bar dataKey="count" fill="rgba(139,92,246,0.8)" radius={[4, 4, 0, 0]} maxBarSize={64} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              {/* Team Status */}
              <section className="rounded border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
                <div className="mb-1 text-sm font-semibold text-white">Team Status Breakdown</div>
                <div className="mb-4 text-[11px] text-(--text-muted)">Current workflow stage of all registered teams</div>
                {compStats.teamStatus.length === 0 ? (
                  <div className="flex h-[240px] items-center justify-center text-sm text-(--text-muted)">No data available</div>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compStats.teamStatus} margin={{ top: 4, right: 16, left: 0, bottom: 16 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="status" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          contentStyle={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                          formatter={(v: number) => [`${v} teams`, 'Count']}
                        />
                        <Bar dataKey="count" fill="rgba(255,255,255,0.25)" radius={[4, 4, 0, 0]} maxBarSize={64} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              {/* Competitor Status */}
              <section className="rounded border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
                <div className="mb-1 text-sm font-semibold text-white">Competitor Verification Status</div>
                <div className="mb-4 text-[11px] text-(--text-muted)">Verification progress of competitors with the COMPETITOR role</div>
                {compStats.competitorStatus.length === 0 ? (
                  <div className="flex h-[240px] items-center justify-center text-sm text-(--text-muted)">No data available</div>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compStats.competitorStatus} margin={{ top: 4, right: 16, left: 0, bottom: 16 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="status" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          contentStyle={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                          formatter={(v: number) => [`${v} people`, 'Count']}
                        />
                        <Bar dataKey="count" fill="rgba(0,230,118,0.7)" radius={[4, 4, 0, 0]} maxBarSize={64} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-6 text-sm text-(--text-muted)">Loading charts...</div>
        )}
      </div>
    </div>
  )
}

export default function AdminStatsPage() {
  return (
    <AuthProvider>
      <AppShell>
        <StatsContent />
      </AppShell>
    </AuthProvider>
  )
}
