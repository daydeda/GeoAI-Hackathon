'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function InviteContent({ code }: { code: string }) {
  const { user, loading: authLoading, refetch } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleJoin = async () => {
    if (!user) {
      // Redirect to login if they aren't authenticated
      // We can pass a callback or just tell them to login
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
        await refetch() // Update auth context
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

  if (authLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-muted)' }}>Verifying credentials...</div>

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background effects */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle at 50% 30%, rgba(0,229,255,0.06) 0%, transparent 60%)`,
      }} />
      
      <div className="animate-fade-in card" style={{
        padding: '48px 40px',
        width: '100%', maxWidth: 420,
        boxShadow: 'var(--glow-cyan)',
        position: 'relative', zIndex: 1,
        textAlign: 'center',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="font-display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 4 }}>
            SQUAD RECRUITMENT
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            AUTHORIZATION REQUIRED
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 32 }} />

        {success ? (
          <div style={{ padding: 16, border: '1px solid var(--accent-green)', background: 'rgba(0, 230, 118, 0.1)', color: 'var(--accent-green)', borderRadius: 6, marginBottom: 24 }}>
            {success}
            <div style={{ fontSize: 12, marginTop: 8, color: 'white' }}>Redirecting to command center...</div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              You have been invited to join a team for the GeoAI Hackathon.
            </p>
            
            <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', marginBottom: '32px' }}>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>INVITE CODE</div>
              <div className="font-mono" style={{ fontSize: 20, color: 'var(--accent-cyan)', letterSpacing: '0.2em' }}>{code}</div>
            </div>

            {error && (
              <div style={{ padding: 12, border: '1px solid var(--accent-red)', background: 'rgba(255, 23, 68, 0.1)', color: 'var(--accent-red)', borderRadius: 6, marginBottom: 24, fontSize: 13, textAlign: 'left' }}>
                ⚠️ {error}
              </div>
            )}

            {!user ? (
              <button
                onClick={() => router.push('/login')}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                LOGIN TO ACCEPT INVITATION
              </button>
            ) : user.team ? (
               <button
               disabled
               className="btn btn-outline"
               style={{ width: '100%', justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}
             >
               CURRENTLY ASSIGNED TO A TEAM
             </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'PROCESSING TRANSFER...' : 'ACCEPT INVITATION & JOIN TEAM'}
              </button>
            )}
          </>
        )}

        <div style={{ marginTop: 24 }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Abort and return to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  // We use React.use() or just simple prop extraction in Next 13+ depending on the exact version,
  // but assuming Next.js App Router where params is directly accessible.
  // Actually, in Next.js 15, `params` is a Promise, so it's a good idea to unwrap it if using next@15,
  // but since we saw 'next': '16.2.2' in package.json, we must treat params as a Promise.
  
  // To avoid Next.js sync params warnings, we can just use React.use(params) OR 
  // simply avoid pulling from params locally and use useSearchParams or useParams.
  // It's safer to use Next.js navigation hooks if there's any strict async requirements.
  return (
    <AuthProvider>
       <InviteContentWrapper params={params} />
    </AuthProvider>
  )
}

import { use } from 'react'

function InviteContentWrapper({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params)
  return <InviteContent code={resolvedParams.code} />
}
