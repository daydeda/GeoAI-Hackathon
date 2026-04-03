'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || '/geoai-2026'

function getLoginErrorMessage(code: string | null) {
  if (!code) return null

  switch (code) {
    case 'oauth_denied':
      return 'Google sign-in was cancelled or denied. Please try again.'
    case 'profile_missing':
      return 'Google profile data is incomplete. Please use a different Google account.'
    case 'auth_failed':
      return 'Sign-in could not be completed on the server. Please try again in a few seconds.'
    default:
      return 'Sign-in failed. Please try again.'
  }
}

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setErrorMessage(getLoginErrorMessage(params.get('error')))
  }, [])

  const handleGoogleLogin = () => {
    window.location.href = `${API}/api/v1/auth/google/start`
  }

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
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,229,255,0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,229,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Card */}
      <div className="animate-fade-in" style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-active)',
        borderRadius: 12, padding: '48px 40px',
        width: '100%', maxWidth: 420,
        boxShadow: 'var(--glow-cyan)',
        position: 'relative', zIndex: 1,
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <div className="font-display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 4 }}>
            GEOAI HACKATHON
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            AGRI-DISASTER AI · 2026
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 32 }} />

        <h2 className="font-display" style={{ fontSize: 20, marginBottom: 8, color: 'var(--text-primary)' }}>
          Operator Authentication
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
          Sign in with your Google account to access the competition platform. Only Google OAuth is supported.
        </p>

        {errorMessage && (
          <div style={{ marginBottom: 20, padding: 12, background: 'rgba(255, 82, 82, 0.08)', border: '1px solid rgba(255, 82, 82, 0.35)', borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#ff9f9f', lineHeight: 1.5 }}>
              {errorMessage}
            </p>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '14px 24px',fontFamily: 'Inter, sans-serif', textTransform: 'none', letterSpacing: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4"/>
            <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" fill="#34A853"/>
            <path d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" fill="#FBBC05"/>
            <path d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ marginTop: 32, padding: 16, background: 'rgba(0, 229, 255, 0.05)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            🔒 <strong style={{ color: 'var(--text-secondary)' }}>Secure auth only.</strong> No email/password accounts. Your Google profile is used for identity verification.
          </p>
        </div>

        <div style={{ marginTop: 24 }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to mission briefing
          </Link>
        </div>
      </div>
    </div>
  )
}
