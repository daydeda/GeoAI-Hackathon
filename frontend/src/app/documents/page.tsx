'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import NavRail from '@/components/NavRail'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, Lock, Download, CheckCircle2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function DocumentVaultContent() {
  const { user } = useAuth()
  const [docInfo, setDocInfo] = useState<{ id: string; version: number; generatedAt: string; downloadUrl: string } | null>(null)
  const [team, setTeam] = useState<{ name: string; status: string; members: Array<{ fullName: string; email?: string; isLeader?: boolean }> } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const teamRes = await fetch(`${API}/api/v1/teams/my`, { credentials: 'include' })
      if (!teamRes.ok) return
      const teamData = await teamRes.json()
      setTeam(teamData)

      if (teamData.status === 'FINALIST') {
        const docRes = await fetch(`${API}/api/v1/teams/${teamData.id}/documents/permission-letter`, { credentials: 'include' })
        if (docRes.ok) setDocInfo(await docRes.json())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const isFinalist = team?.status === 'FINALIST'

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 overflow-hidden">
      {/* Background watermark */}
      <div className="absolute bottom-0 right-0 left-0 flex justify-center items-end pointer-events-none z-0 pb-16 sm:pb-20 lg:pb-24">
        <div className="font-display text-3xl sm:text-5xl lg:text-7xl text-[rgba(0,229,255,0.03)] select-none tracking-widest">
          GEOSPATIAL INTELLIGENCE
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white">Finalist Documents</h1>
            <span className="inline-block badge badge-pass text-xs sm:text-sm">VERIFICATION: ACTIVE</span>
          </div>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm lg:text-base leading-relaxed max-w-full sm:max-w-2xl">
            Access your official competition documents. These are generated only for teams that have reached Finalist status.
          </p>
        </div>

        {loading ? (
          <div className="py-12 sm:py-16 lg:py-20 text-center text-[var(--text-muted)] text-sm sm:text-base">Loading…</div>
        ) : !isFinalist ? (
          <div className="mt-6 sm:mt-8 lg:mt-12 text-center py-12 sm:py-16 lg:py-20">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 opacity-30">🔒</div>
            <div className="font-display text-lg sm:text-xl lg:text-2xl text-[var(--text-muted)] mb-2 sm:mb-3">FINALIST STATUS REQUIRED</div>
            <div className="text-xs sm:text-sm lg:text-base text-[var(--text-muted)]">Your team has not yet reached Finalist status. Documents will be unlocked upon promotion.</div>
          </div>
        ) : (
          <>
            {/* Team status banner */}
            <div className="mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10 p-4 sm:p-6 lg:p-8 bg-[var(--bg-surface)] border border-[var(--accent-cyan)] rounded-lg flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 lg:gap-8 shadow-[var(--glow-cyan-sm)]">
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <div className="w-10 sm:w-12 lg:w-14 h-10 sm:h-12 lg:h-14 rounded-lg bg-[rgba(0,230,118,0.2)] flex items-center justify-center text-xl sm:text-2xl lg:text-3xl flex-shrink-0">
                  <CheckCircle2 size={24} className="text-[var(--accent-green)]" />
                </div>
                <div>
                  <div className="font-display text-sm sm:text-lg lg:text-xl text-[var(--accent-green)] tracking-widest">FINALIST ONSITE</div>
                  {docInfo && <div className="text-[8px] sm:text-xs lg:text-sm text-[var(--text-muted)]">Verification Code: GX-{docInfo.id.slice(0, 8).toUpperCase()}</div>}
                </div>
              </div>
              <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-[var(--border-subtle)] pt-4 sm:pt-0 sm:pl-4 lg:pl-6">
                <div className="text-[8px] sm:text-xs lg:text-sm text-[var(--text-muted)]">ACTIVE TEAM</div>
                <div className="font-display text-base sm:text-lg lg:text-xl mt-1 text-white truncate">{team?.name}</div>
                <div className="text-[8px] sm:text-xs lg:text-sm text-[var(--text-muted)] mt-1">👥 {team?.members?.length ?? 0} Members</div>
              </div>
            </div>

            {/* Member permission letters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
              <h2 className="font-display text-lg sm:text-xl lg:text-2xl text-white">Personalized Leave Letters</h2>
              <div className="font-mono text-[8px] sm:text-xs lg:text-sm text-[var(--text-muted)] whitespace-nowrap">FORMAT: PDF/A-3 COMPLIANT</div>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4">
              {(team?.members ?? []).map((member, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--border-active)] transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-sm sm:text-base lg:text-lg flex-shrink-0">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm lg:text-base text-white truncate">{member.fullName}</div>
                    <div className="text-[8px] sm:text-xs lg:text-sm text-[var(--text-secondary)] truncate">{member.email}</div>
                    {member.isLeader && <div className="text-[8px] sm:text-xs lg:text-sm text-[var(--accent-green)] mt-1">TEAM LEADER</div>}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <button className="p-1.5 sm:p-2 hover:bg-[var(--bg-elevated)] rounded transition-colors" title="View">
                      <Eye size={16} className="text-[var(--accent-cyan)]" />
                    </button>
                    <button className="p-1.5 sm:p-2 hover:bg-[var(--bg-elevated)] rounded transition-colors" title="Download">
                      <Download size={16} className="text-[var(--accent-green)]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <AuthProvider>
      <div className="flex">
        <NavRail />
        <main className="page-with-rail flex-1">
          <DocumentVaultContent />
        </main>
      </div>
    </AuthProvider>
  )
}
