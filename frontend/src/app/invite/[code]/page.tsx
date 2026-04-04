'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Copy, LogIn, AlertCircle, CheckCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function InviteContent({ code }: { code: string }) {
  const { user, loading: authLoading, refetch } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleJoin = async () => {
    if (!user) {
      router.push('/login?returnUrl=/invite/' + code)
      return
    }

    if (user.team) {
      setError('You are already assigned to a team.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/v1/invites/${code}/join`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSuccess(`Successfully joined team: ${data.teamName}`)
        await refetch()
        setTimeout(() => {
          router.push('/team')
        }, 1500)
      } else {
        setError(data.error || data.message || 'Failed to join team.')
      }
    } catch {
      setError('A network error occurred while attempting to join.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-muted)] text-sm sm:text-base">Verifying credentials...</div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(0,229,255,0.06) 0%, transparent 60%)' }} />
      
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-8 sm:p-10 shadow-2xl relative z-10 animate-fade-in">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="font-display text-xl sm:text-2xl font-bold text-[var(--accent-cyan)] mb-2">
            SQUAD RECRUITMENT
          </div>
          <div className="text-xs sm:text-sm text-[var(--text-muted)] tracking-widest">
            AUTHORIZATION REQUIRED
          </div>
        </div>

        <div className="h-px bg-[var(--border-subtle)] mb-6 sm:mb-8" />

        {success ? (
          <div className="p-4 border border-[var(--accent-green)] bg-[rgba(0,230,118,0.1)] text-[var(--accent-green)] rounded-lg mb-4 flex gap-3 items-start">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="text-sm sm:text-base">
              {success}
              <div className="text-[12px] sm:text-xs mt-2 text-white">Redirecting to command center...</div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-4 sm:mb-6 leading-relaxed">
              You have been invited to join a team for the GeoAI Hackathon.
            </p>
            
            <div className="bg-[var(--bg-elevated)] p-4 rounded mb-6 sm:mb-8">
              <div className="font-mono text-[8px] sm:text-xs text-[var(--text-muted)] mb-2 tracking-widest">INVITE CODE</div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-lg sm:text-2xl text-[var(--accent-cyan)] tracking-wider">{code}</div>
                <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded transition" title="Copy code">
                  <Copy size={16} className="text-[var(--text-muted)]" />
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 sm:p-4 border border-[var(--accent-red)] bg-[rgba(255,23,68,0.1)] text-[var(--accent-red)] rounded mb-4 sm:mb-6 flex gap-3 items-start text-xs sm:text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!user ? (
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-[var(--accent-cyan)] text-black px-4 py-3 sm:py-4 font-bold text-xs sm:text-sm tracking-widest rounded hover:brightness-110 transition flex items-center justify-center gap-2"
              >
                <LogIn size={16} /> LOGIN TO ACCEPT INVITATION
              </button>
            ) : user.team ? (
              <button
                disabled
                className="w-full bg-[var(--bg-base)] text-[var(--text-muted)] border border-[var(--border-subtle)] px-4 py-3 sm:py-4 font-bold text-xs sm:text-sm tracking-widest rounded opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
              >
                CURRENTLY ASSIGNED TO A TEAM
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full bg-[var(--accent-cyan)] text-black px-4 py-3 sm:py-4 font-bold text-xs sm:text-sm tracking-widest rounded hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'PROCESSING TRANSFER...' : 'ACCEPT INVITATION & JOIN TEAM'}
              </button>
            )}
          </>
        )}

        <div className="mt-6 sm:mt-8">
          <Link href="/" className="inline-flex items-center text-[8px] sm:text-xs text-[var(--text-muted)] hover:text-white transition gap-1">
            ← Abort and return to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params)
  return (
    <AuthProvider>
      <InviteContent code={resolvedParams.code} />
    </AuthProvider>
  )
}
