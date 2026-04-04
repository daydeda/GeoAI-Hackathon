'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type LoginMeResponse = {
  roles?: string[]
  profileCompleted?: boolean
}

function getPostLoginPath(user: LoginMeResponse) {
  const roles = user.roles || []
  if (roles.length === 0) return '/team'
  if (roles.includes('ADMIN')) return '/admin'
  if (roles.includes('JUDGE')) return '/judge'
  if (roles.includes('MODERATOR')) return '/moderator'
  if (roles.includes('COMPETITOR') && !user.profileCompleted) return '/team'
  return '/dashboard'
}

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
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is already authenticated
        const res = await fetch(`${API}/api/v1/auth/me`, { credentials: 'include' })
        if (res.ok) {
          const me = await res.json() as LoginMeResponse
          // User is authenticated, redirect based on role and onboarding state.
          router.push(getPostLoginPath(me))
          return
        }
      } catch {
        // Not authenticated, continue
      }

      // Check for error messages
      const params = new URLSearchParams(window.location.search)
      setErrorMessage(getLoginErrorMessage(params.get('error')))
      setIsChecking(false)
    }

    checkAuth()
  }, [router])

  const handleGoogleLogin = () => {
    window.location.href = `${API}/api/v1/auth/google/start`
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-(--bg-base) flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      {/* Background effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(0,229,255,0.06) 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,229,255,0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,229,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm animate-fade-in rounded-lg border border-(--border-active) bg-(--bg-surface) p-6 sm:p-8 shadow-lg"
        style={{ boxShadow: 'var(--glow-cyan)' }}>
        {/* Logo */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="font-display text-xl sm:text-2xl font-bold text-(--accent-cyan) mb-2">
            GEOAI HACKATHON
          </div>
          <div className="text-xs sm:text-xs font-mono text-(--text-muted) tracking-widest">
            AGRI-DISASTER AI · 2026
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-(--border-subtle) mb-6 sm:mb-8" />

        <h2 className="font-display text-lg sm:text-xl mb-2 sm:mb-3 text-(--text-primary) text-center">
          Operator Authentication
        </h2>
        <p className="text-xs sm:text-sm text-(--text-secondary) mb-6 sm:mb-8 leading-relaxed text-center">
          Sign in with your Google account to access the competition platform. Only Google OAuth is supported.
        </p>

        {errorMessage && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-md bg-[rgba(255,82,82,0.08)] border border-[rgba(255,82,82,0.35)] flex items-start gap-2 sm:gap-3">
            <AlertCircle size={16} className="text-[#ff9f9f] mt-0.5 flex-shrink-0 sm:mt-1" aria-hidden="true" />
            <p className="text-xs sm:text-sm text-[#ff9f9f] leading-relaxed">
              {errorMessage}
            </p>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isChecking}
          className="w-full flex items-center justify-center gap-3 py-3 sm:py-3.5 px-4 sm:px-6 rounded-md bg-(--accent-cyan) text-(--bg-base) font-semibold text-sm sm:text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#1f2937"/>
            <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" fill="#1f2937"/>
            <path d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" fill="#1f2937"/>
            <path d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" fill="#1f2937"/>
          </svg>
          <span>{isChecking ? 'Checking authorization...' : 'Sign in with Google'}</span>
        </button>
      </div>
    </div>
  )
}
