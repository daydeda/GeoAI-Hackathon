'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { useAuth, TeamInfo } from '@/contexts/AuthContext'
import CustomDropdown from '@/components/CustomDropdown'
import { AlertTriangle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const LIVE_REFRESH_MS = 8000

interface Member { fullName: string; email: string; isLeader: boolean; userId: string }
interface TeamData extends TeamInfo { institution: string; memberCount: number; members: Member[]; inviteCode: string }

function TeamContent() {
  const { user, loading: authLoading, refetch: refetchUser } = useAuth()
  const [team, setTeam] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  
  // Forms
  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [track, setTrack] = useState('SMART_AGRICULTURE')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/teams/my`, { credentials: 'include' })
      if (res.ok) setTeam(await res.json())
      else setTeam(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTeam()

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchTeam()
      }
    }, LIVE_REFRESH_MS)

    const onFocus = () => {
      void fetchTeam()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchTeam()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [fetchTeam])

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch(`${API}/api/v1/teams`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, institution, track })
    })
    if (res.ok) { 
      await fetchTeam()
      await refetchUser() 
    } else { 
      const d = await res.json()
      setError(d.error || d.message || 'Failed to create team') 
    }
  }

  const joinTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch(`${API}/api/v1/teams/join`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode })
    })
    if (res.ok) { 
      await fetchTeam()
      await refetchUser() 
    } else { 
      const d = await res.json()
      setError(d.error || d.message || 'Failed to join team. Check code or team limit.') 
    }
  }

  const removeMember = async (userId: string) => {
    if (!team) return
    const res = await fetch(`${API}/api/v1/teams/${team.id}/members/${userId}`, {
      method: 'DELETE', credentials: 'include'
    })
    if (res.ok) fetchTeam()
  }

  const generateInvite = async () => {
    if (!team) return
    setError('')
    const res = await fetch(`${API}/api/v1/teams/${team.id}/invites`, {
      method: 'POST', credentials: 'include'
    })
    if (res.ok) fetchTeam()
    else {
      const d = await res.json()
      setError(d.error || 'Failed to generate invite code')
    }
  }

  if (loading || authLoading) return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="font-mono text-sm text-(--accent-cyan)">Synching with command…</div>
    </div>
  )

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-4 tracking-widest">
          TEAM OPERATIONS
        </h1>
        <p className="text-xs sm:text-sm text-(--text-secondary) mb-6 sm:mb-8">
          Manage your crew, track affiliation, and invite operatives.
        </p>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-md bg-[rgba(255,23,68,0.1)] border border-(--accent-red) text-(--accent-red) text-xs sm:text-sm flex items-start gap-2 sm:gap-3">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!team ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Create Team */}
            <div className="card p-4 sm:p-6 rounded-lg border border-(--border-subtle) bg-(--bg-surface)">
              <div className="font-mono text-[10px] sm:text-xs text-(--accent-cyan) mb-4 tracking-widest">CREATE NEW UNIT</div>
              <form onSubmit={createTeam} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="label block text-xs sm:text-sm font-mono mb-2 text-(--text-secondary)">Team Name</label>
                  <input
                    className="input w-full px-3 py-2 rounded border border-(--border-subtle) bg-(--bg-base) text-xs sm:text-sm focus:border-(--accent-cyan) focus:outline-none"
                    required
                    placeholder="E.g. Orbital Hawks"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label block text-xs sm:text-sm font-mono mb-2 text-(--text-secondary)">Institution / Organization</label>
                  <input
                    className="input w-full px-3 py-2 rounded border border-(--border-subtle) bg-(--bg-base) text-xs sm:text-sm focus:border-(--accent-cyan) focus:outline-none"
                    required
                    placeholder="University or Company"
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label block text-xs sm:text-sm font-mono mb-2 text-(--text-secondary)">Mission Track</label>
                  <CustomDropdown
                    value={track}
                    onChange={setTrack}
                    options={[
                      { value: 'SMART_AGRICULTURE', label: 'Smart Agriculture' },
                      { value: 'DISASTER_FLOOD_RESPONSE', label: 'Disaster & Flood Response' },
                    ]}
                    buttonClassName="text-xs sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-full px-4 py-2.5 rounded font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity mt-4"
                >
                  INITIALIZE TEAM
                </button>
              </form>
            </div>

            {/* Join Team */}
            <div className="card p-4 sm:p-6 rounded-lg border border-(--border-subtle) bg-(--bg-surface)">
              <div className="font-mono text-[10px] sm:text-xs text-(--text-muted) mb-4 tracking-widest">JOIN EXISTING UNIT</div>
              <form onSubmit={joinTeam} className="space-y-4">
                <div>
                  <label className="label block text-xs sm:text-sm font-mono mb-2 text-(--text-secondary)">Invitation Code</label>
                  <input
                    className="input w-full px-3 py-2 rounded border border-(--border-subtle) bg-(--bg-base) text-xs sm:text-sm focus:border-(--accent-cyan) focus:outline-none"
                    required
                    placeholder="Enter 8-character code"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-outline w-full px-4 py-2.5 rounded font-semibold text-xs sm:text-sm border border-(--border-active) hover:bg-(--bg-base) transition-colors mt-6"
                >
                  REQUEST TRANSFER
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 sm:gap-6">
            {/* Left: Crew Roster */}
            <div className="card p-4 sm:p-6 rounded-lg border border-(--border-subtle) bg-(--bg-surface)">
              <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <h2 className="font-display text-lg sm:text-xl">{team.name}</h2>
                <span className="badge badge-pass text-[10px] sm:text-xs px-2 sm:px-3 py-1">
                  {team.memberCount || team.members.length} / 4 DEPLOYED
                </span>
              </div>

              <div className="p-3 sm:p-4 bg-(--bg-elevated) rounded-lg mb-4 sm:mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <div className="font-mono text-[10px] text-(--text-muted) mb-1 sm:mb-2">AFFILIATION</div>
                    <div className="font-mono">{team.institution}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-(--text-muted) mb-1 sm:mb-2">TRACK</div>
                    <div className="text-(--accent-cyan) font-semibold">{team.track.replace(/_/g, ' ')}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-(--text-muted) mb-1 sm:mb-2">STATUS</div>
                    <div className="font-mono">{team.status}</div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-(--border-subtle)">
                      <th className="text-left py-2 px-2 font-mono text-[10px] text-(--text-muted)">OPERATIVE</th>
                      <th className="text-left py-2 px-2 font-mono text-[10px] text-(--text-muted)">ROLE</th>
                      {team.isLeader && <th className="text-left py-2 px-2 font-mono text-[10px] text-(--text-muted)">ACTION</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {team.members.map(m => (
                      <tr key={m.userId} className="border-b border-(--border-subtle) hover:bg-[rgba(0,229,255,0.02)]">
                        <td className="py-3 px-2">
                          <div className="font-semibold text-xs sm:text-sm">{m.fullName} {m.userId === user?.id && '(You)'}</div>
                          <div className="text-[10px] text-(--text-muted) truncate">{m.email}</div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`badge text-[10px] px-2 py-1 rounded ${m.isLeader ? 'bg-(--accent-cyan) text-(--bg-base)' : 'bg-(--bg-base) text-(--accent-cyan)'}`}>
                            {m.isLeader ? 'LEADER' : 'MEMBER'}
                          </span>
                        </td>
                        {team.isLeader && (
                          <td className="py-3 px-2">
                            {!m.isLeader && (
                              <button
                                className="text-[10px] px-2 py-1 rounded text-(--accent-red) hover:bg-[rgba(255,23,68,0.1)] transition-colors"
                                onClick={() => removeMember(m.userId)}
                              >
                                REMOVE
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          {/* Right: Invite Code */}
          {team.isLeader && (
            <div className="card p-4 sm:p-6 rounded-lg border border-(--border-subtle) bg-(--bg-surface) h-fit">
              <h3 className="font-display text-lg sm:text-xl mb-3 sm:mb-4">Recruitment Link</h3>
              <p className="text-xs sm:text-sm text-(--text-secondary) mb-4 sm:mb-6">
                Share this secure code with your teammates to allow them to join your unit.
              </p>
              
              <label className="block font-mono text-[10px] text-(--text-muted) mb-2 sm:mb-3 tracking-widest">INVITATION CODE</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
                <input
                  className="flex-1 font-mono px-3 py-2 sm:py-2.5 rounded border border-(--border-subtle) bg-(--bg-base) text-sm text-center text-(--accent-cyan) tracking-widest focus:outline-none focus:border-(--accent-cyan)"
                  readOnly
                  value={team.inviteCode || ''}
                />
                {team.inviteCode ? (
                  <button
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded font-semibold text-xs sm:text-sm transition-colors flex-shrink-0 ${
                      copied
                        ? 'bg-(--accent-green) text-(--bg-base)'
                        : 'bg-(--accent-cyan) text-(--bg-base) hover:opacity-90'
                    }`}
                    onClick={() => {
                      navigator.clipboard.writeText(team.inviteCode)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {copied ? '✓ COPIED' : 'COPY'}
                  </button>
                ) : (
                  <button
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded font-semibold text-xs sm:text-sm bg-(--accent-cyan) text-(--bg-base) hover:opacity-90 transition-opacity flex-shrink-0"
                    onClick={generateInvite}
                  >
                    GENERATE
                  </button>
                )}
              </div>

              <div className="text-xs text-(--text-muted) bg-(--bg-elevated) p-3 sm:p-4 rounded">
                <strong>Note:</strong> Maximum 4 members per team. Code gives immediate access. Do not share publicly.
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

export default function TeamPage() {
  return (
    <AuthProvider>
      <AppShell>
        <TeamContent />
      </AppShell>
    </AuthProvider>
  )
}
