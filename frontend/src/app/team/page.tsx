'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { useAuth, TeamInfo } from '@/contexts/AuthContext'

const API = process.env.NEXT_PUBLIC_API_URL || '/geoai-2026'

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

  useEffect(() => { fetchTeam() }, [fetchTeam])

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

  if (loading || authLoading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Synching with command…</div>

  return (
    <div style={{ padding: 32, maxWidth: 960 }}>
      <h1 className="font-display" style={{ fontSize: 36, marginBottom: 8 }}>Team Operations</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Manage your crew, track affiliation, and invite operatives.</p>

      {error && (
        <div style={{ padding: 12, border: '1px solid var(--accent-red)', background: 'rgba(255, 23, 68, 0.1)', color: 'var(--accent-red)', borderRadius: 6, marginBottom: 24, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {!team ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          {/* Create Team */}
          <div className="card" style={{ padding: 24 }}>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--accent-cyan)', marginBottom: 16 }}>CREATE NEW UNIT</div>
            <form onSubmit={createTeam}>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Team Name</label>
                <input className="input" required placeholder="E.g. Orbital Hawks" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Institution / Organization</label>
                <input className="input" required placeholder="University or Company" value={institution} onChange={e => setInstitution(e.target.value)} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="label">Mission Track</label>
                <select className="input" value={track} onChange={e => setTrack(e.target.value)}>
                  <option value="SMART_AGRICULTURE">Smart Agriculture (Primary)</option>
                  <option value="DISASTER_FLOOD_RESPONSE">Disaster & Flood Response</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>INITIALIZE TEAM</button>
            </form>
          </div>

          {/* Join Team */}
          <div className="card" style={{ padding: 24 }}>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>JOIN EXISTING UNIT</div>
            <form onSubmit={joinTeam}>
              <div style={{ marginBottom: 24 }}>
                <label className="label">Invitation Code</label>
                <input className="input" required placeholder="Enter 8-character code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>REQUEST TRANSFER</button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 24 }}>
          {/* Left: Crew Roster */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 className="font-display" style={{ fontSize: 24 }}>{team.name}</h2>
              <span className="badge badge-pass">{team.memberCount || team.members.length} / 4 DEPLOYED</span>
            </div>

            <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>AFFILIATION</div>
                  <div style={{ fontSize: 13 }}>{team.institution}</div>
                </div>
                <div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>TRACK</div>
                  <div style={{ fontSize: 13, color: 'var(--accent-cyan)' }}>{team.track.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>STATUS</div>
                  <div style={{ fontSize: 13 }}>{team.status}</div>
                </div>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>OPERATIVE</th>
                  <th>ROLE</th>
                  {team.isLeader && <th>ACTION</th>}
                </tr>
              </thead>
              <tbody>
                {team.members.map(m => (
                  <tr key={m.userId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.fullName} {m.userId === user?.id && '(You)'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${m.isLeader ? 'badge-finalist' : 'badge-draft'}`}>
                        {m.isLeader ? 'LEADER' : 'MEMBER'}
                      </span>
                    </td>
                    {team.isLeader && (
                      <td>
                        {!m.isLeader && (
                          <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 10, color: 'var(--accent-red)' }} onClick={() => removeMember(m.userId)}>
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

          {/* Right: Invite Code */}
          {team.isLeader && (
            <div className="card" style={{ padding: 24, alignSelf: 'flex-start' }}>
              <h3 className="font-display" style={{ fontSize: 18, marginBottom: 12 }}>Recruitment Link</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Share this secure code with your teammates to allow them to join your unit.
              </p>
              
              <label className="label">INVITATION CODE</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input className="input font-mono" readOnly value={team.inviteCode || ''} style={{ color: 'var(--accent-cyan)', fontSize: 16, letterSpacing: '0.1em', textAlign: 'center' }} />
                {team.inviteCode ? (
                  <button 
                    className={`btn ${copied ? 'btn-outline' : 'btn-primary'}`} 
                    onClick={() => {
                      navigator.clipboard.writeText(team.inviteCode)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {copied ? '✓ COPIED' : 'COPY'}
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={generateInvite}>GENERATE</button>
                )}
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: 12, borderRadius: 6 }}>
                <strong>Note:</strong> Maximum 4 members per team. Code gives immediate access. Do not share publicly.
              </div>
            </div>
          )}
        </div>
      )}
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
