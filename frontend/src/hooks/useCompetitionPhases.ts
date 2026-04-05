'use client'

import { useEffect, useMemo, useState } from 'react'
import { CompetitionPhase, DEFAULT_COMPETITION_PHASES, getCurrentPhase, getTimeline } from '@/lib/competitionPhase'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type PhaseResponse = {
  data?: CompetitionPhase[]
}

export function useCompetitionPhases() {
  const [phases, setPhases] = useState<CompetitionPhase[]>(DEFAULT_COMPETITION_PHASES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const fetchPhases = async () => {
      try {
        const response = await fetch(`${API}/api/v1/phases`, { credentials: 'include' })
        if (!response.ok) return

        const payload = (await response.json()) as PhaseResponse
        if (!active || !payload.data || payload.data.length === 0) return
        setPhases(payload.data)
      } catch {
        // Keep local defaults if endpoint is temporarily unavailable.
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchPhases()
    const intervalId = setInterval(fetchPhases, 30000)

    const handleLocalPhaseUpdate = () => {
      void fetchPhases()
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'geoai-phases-updated-at') {
        void fetchPhases()
      }
    }

    window.addEventListener('geoai:phases-updated', handleLocalPhaseUpdate)
    window.addEventListener('storage', handleStorage)

    return () => {
      active = false
      clearInterval(intervalId)
      window.removeEventListener('geoai:phases-updated', handleLocalPhaseUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const timeline = useMemo(() => getTimeline(phases), [phases])
  const currentPhase = useMemo(() => getCurrentPhase(phases), [phases])

  return {
    phases,
    timeline,
    currentPhase,
    loading,
  }
}
