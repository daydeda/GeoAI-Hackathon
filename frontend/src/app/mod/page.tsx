'use client'

import { useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Menu, X, ChevronDown, Check, XIcon, RefreshCw } from 'lucide-react'

function ModContent() {
  const [search, setSearch] = useState('')

  const submissions = [
    { id: '1', team: { name: 'Alpha Centauri Labs', initial: 'A' }, track: 'Atmospheric Mapping', submittedAt: '2024.11.08 14:32:01', artifact: 'PROPOSAL_V4.PDF', status: 'PENDING' },
    { id: '2', team: { name: 'Satellite Watchers', initial: 'S' }, track: 'Urban Expansion', submittedAt: '2024.11.08 12:10:55', artifact: 'URBAN_GROWTH_REPORT.PDF', status: 'PASSED' },
    { id: '3', team: { name: 'Neon Geospatial', initial: 'N' }, track: 'Oceanic Dynamics', submittedAt: '2024.11.07 23:45:12', artifact: 'WAVE_ANALYSIS_FINAL.PDF', status: 'FAILED' },
    { id: '4', team: { name: 'Eco-Sync Systems', initial: 'E' }, track: 'Vegetative Density', submittedAt: '2024.11.07 20:15:33', artifact: 'BIOMASS_DATASET_V2.PDF', status: 'PENDING' },
  ]

  const StatCard = ({ label, value, change, changeColor, color }: any) => (
    <div className="bg-[var(--bg-base)] p-4 sm:p-6 lg:p-8 flex flex-col gap-3">
      <div className="font-mono text-[8px] sm:text-[9px] lg:text-xs color-[var(--text-muted)] tracking-widest uppercase">{label}</div>
      <div className="flex items-end gap-2 sm:gap-3">
        <div className="font-display text-2xl sm:text-3xl lg:text-5xl font-bold" style={{ color }}>{value}</div>
        <div className="text-xs sm:text-sm pb-1" style={{ color: changeColor }}>{change}</div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-base)]">
      <header className="sticky top-0 z-50 bg-[var(--bg-base)] border-b border-[var(--border-subtle)] flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16">
        <div className="flex items-center gap-4 sm:gap-8 min-w-0 flex-1">
          <div className="font-display text-base sm:text-lg lg:text-xl font-bold text-[var(--accent-cyan)] tracking-widest truncate">GEOAI</div>
          <nav className="hidden lg:flex gap-4 lg:gap-6 text-xs lg:text-sm text-white font-medium">
            <Link href="#" className="text-[var(--text-secondary)] hover:text-white transition">Challenges</Link>
            <Link href="#" className="text-[var(--text-secondary)] hover:text-white transition">Leaderboard</Link>
            <Link href="#" className="text-[var(--text-secondary)] hover:text-white transition">Docs</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm text-[var(--accent-cyan)] hidden sm:inline">Role: Mod</span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[var(--bg-surface)] rounded flex items-center justify-center text-sm">👤</div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden sm:block w-40 lg:w-48 bg-[var(--bg-base)] border-r border-[var(--border-subtle)] py-6 sm:py-8 px-3 sm:px-4 flex-shrink-0 overflow-y-auto">
          <div className="space-y-4 sm:space-y-6">
            <Link href="#" className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-[var(--accent-cyan)] font-semibold hover:bg-[var(--bg-surface)] rounded transition">DASHBOARD</Link>
            <Link href="#" className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-white transition">SUBMISSIONS</Link>
            <Link href="#" className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-white transition">ANALYTICS</Link>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
                <div>
                  <div className="font-mono text-[8px] sm:text-xs text-[var(--accent-green)] mb-1 sm:mb-2 tracking-widest">■ INTERNAL OPERATIONS</div>
                  <h1 className="font-display text-xl sm:text-2xl lg:text-3xl text-white font-bold">Moderator Dashboard</h1>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[8px] sm:text-xs text-[var(--text-muted)] mb-1 tracking-widest">SYSTEM_STATUS: NOMINAL</div>
                  <div className="flex items-center gap-2 justify-start sm:justify-end">
                    <span className="w-2 h-2 bg-[var(--accent-green)]" />
                    <span className="text-[8px] sm:text-xs text-[var(--accent-green)] font-semibold tracking-widest">OPERATIONAL</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[rgba(255,255,255,0.05)]">
                <StatCard label="TOTAL" value="1,284" change="+12%" changeColor="var(--accent-green)" color="white" />
                <StatCard label="PENDING" value="42" change="Critical" changeColor="var(--accent-amber)" color="var(--accent-amber)" />
                <StatCard label="PASSED" value="892" change="69.5%" changeColor="var(--text-muted)" color="var(--accent-green)" />
                <StatCard label="FAILED" value="350" change="27.2%" changeColor="var(--text-muted)" color="#ff6275" />
              </div>
            </div>
          </div>

          <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold flex-wrap">
                <span className="text-[var(--text-muted)]">≡ FILTERS</span>
                <div className="flex items-center gap-1 text-[var(--text-secondary)] border-b border-[rgba(255,255,255,0.2)] pb-1 cursor-pointer">
                  ALL TRACKS <ChevronDown size={12} />
                </div>
                <div className="flex items-center gap-1 text-[var(--text-secondary)] border-b border-[rgba(255,255,255,0.2)] pb-1 cursor-pointer">
                  ALL STATUS <ChevronDown size={12} />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <input
                    placeholder="Search teams..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full sm:w-48 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded px-3 py-2 text-xs sm:text-sm text-white placeholder-[var(--text-muted)] outline-none"
                  />
                </div>
                <button className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-2 rounded flex items-center justify-center text-white hover:bg-[var(--bg-elevated)]/80 transition">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                  <th className="py-3 sm:py-4 px-2 sm:px-3 text-[8px] sm:text-xs text-[var(--text-muted)] font-semibold tracking-widest">TEAM</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-3 text-[8px] sm:text-xs text-[var(--text-muted)] font-semibold tracking-widest hidden sm:table-cell">TRACK</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-3 text-[8px] sm:text-xs text-[var(--text-muted)] font-semibold tracking-widest hidden lg:table-cell">DATE</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-3 text-[8px] sm:text-xs text-[var(--text-muted)] font-semibold tracking-widest hidden md:table-cell">ARTIFACT</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-3 text-[8px] sm:text-xs text-[var(--text-muted)] font-semibold tracking-widest">STATUS</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-3 text-[8px] sm:text-xs text-[var(--text-muted)] font-semibold tracking-widest">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.01)] transition">
                    <td className="py-3 sm:py-4 px-2 sm:px-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[rgba(0,229,255,0.1)] text-[var(--accent-cyan)] flex items-center justify-center rounded text-[10px] sm:text-xs font-bold flex-shrink-0">{sub.team.initial}</div>
                        <span className="font-semibold text-white truncate">{sub.team.name}</span>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-3 text-[var(--text-secondary)] hidden sm:table-cell truncate">{sub.track}</td>
                    <td className="py-3 sm:py-4 px-2 sm:px-3 font-mono text-[var(--text-muted)] hidden lg:table-cell text-[9px] sm:text-xs">{sub.submittedAt}</td>
                    <td className="py-3 sm:py-4 px-2 sm:px-3 hidden md:table-cell">
                      <div className="inline-flex items-center gap-1 text-[var(--accent-cyan)] text-[9px] sm:text-xs font-semibold">📄 <span className="hidden lg:inline">{sub.artifact}</span></div>
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-3">
                      <span className={`inline-block text-[8px] sm:text-xs font-bold tracking-widest py-1 px-2 rounded border ${
                        sub.status === 'PENDING' ? 'text-[var(--accent-amber)] border-[rgba(255,167,38,0.3)] bg-[rgba(255,167,38,0.1)]' :
                        sub.status === 'PASSED' ? 'text-[var(--accent-green)] border-[rgba(0,230,118,0.3)] bg-[rgba(0,230,118,0.1)]' :
                        'text-[#ff6275] border-[rgba(255,98,117,0.3)] bg-[rgba(255,98,117,0.1)]'
                      }`}>
                        ■ {sub.status}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-3">
                      {sub.status === 'PENDING' ? (
                        <div className="inline-flex gap-1 sm:gap-2">
                          <button className="w-6 h-6 sm:w-8 sm:h-8 bg-[rgba(0,230,118,0.1)] border border-[var(--accent-green)] text-[var(--accent-green)] rounded flex items-center justify-center hover:bg-[rgba(0,230,118,0.2)] transition">
                            <Check size={14} />
                          </button>
                          <button className="w-6 h-6 sm:w-8 sm:h-8 bg-[rgba(255,98,117,0.1)] border border-[#ff6275] text-[#ff6275] rounded flex items-center justify-center hover:bg-[rgba(255,98,117,0.2)] transition">
                            <XIcon size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[8px] sm:text-xs text-[var(--text-muted)] cursor-pointer hover:text-white transition">{sub.status === 'PASSED' ? 'DETAILS' : 'REVIEW'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm">
            <div className="text-[var(--text-muted)]">SHOWING 1 TO 4 OF 1,284 ENTRIES</div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="text-[var(--text-muted)] hover:text-white transition px-2 py-1">PREVIOUS</button>
              <button className="w-6 h-6 sm:w-8 sm:h-8 border border-[var(--border-active)] bg-[rgba(0,229,255,0.1)] text-[var(--accent-cyan)] rounded flex items-center justify-center">1</button>
              <button className="w-6 h-6 sm:w-8 sm:h-8 border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-white rounded flex items-center justify-center hover:bg-[var(--bg-elevated)]/80 transition">2</button>
              <button className="w-6 h-6 sm:w-8 sm:h-8 border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-white rounded flex items-center justify-center hover:bg-[var(--bg-elevated)]/80 transition">3</button>
              <button className="text-[var(--text-muted)] hover:text-white transition px-2 py-1">NEXT</button>
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[8px] sm:text-xs text-[var(--text-muted)] tracking-widest">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4">
          <div>© 2024 GEOAI HACKATHON</div>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <span>PRIVACY POLICY</span>
            <span>TERMS OF SERVICE</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function ModPage() {
  return (
    <AuthProvider>
      <ModContent />
    </AuthProvider>
  )
}
