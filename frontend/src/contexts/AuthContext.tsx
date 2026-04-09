'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/'

export interface TeamInfo {
  id: string
  name: string
  track: string
  status: string
  isLeader: boolean
}

export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  roles: string[]
  profileCompleted?: boolean
  profile?: {
    firstName?: string | null
    lastName?: string | null
    experience?: string | null
    university?: string | null
    yearOfStudy?: number | null
    phoneNumber?: string | null
    address?: string | null
    idCardFileUploaded?: boolean
  }
  team: TeamInfo | null
}

interface AuthCtx {
  user: User | null
  loading: boolean
  refetch: () => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  refetch: async () => {}, logout: async () => {}, hasRole: () => false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = async () => {
    try {
      const res = await fetch(`${API}/api/v1/auth/me`, { credentials: 'include' })
      if (res.ok) setUser(await res.json())
      else setUser(null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMe() }, [])

  const logout = async () => {
    await fetch(`${API}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
    window.location.href = APP_BASE_PATH
  }

  const hasRole = (role: string) => user?.roles?.includes(role) ?? false

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchMe, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
