'use client'

import { useEffect, useMemo, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export type TimelineStatus = 'done' | 'active' | 'upcoming'

export type CompetitionPhase = {
  key: string
  phase: string
  dateLabel: string
  title: string
  desc: string
  date: string
}

export type TimelineItem = CompetitionPhase & {
  status: TimelineStatus
}

const EMPTY_CURRENT_PHASE: TimelineItem = {
  key: 'pending',
  phase: 'PHASE --',
  dateLabel: '',
  title: 'Timeline Unavailable',
  desc: 'Phase data is temporarily unavailable.',
  date: new Date().toISOString(),
  status: 'active',
}

function normalizeDateLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date
    .toLocaleString('en-GB', { day: '2-digit', month: 'short' })
    .toUpperCase()
    .replace('.', '')
}

function applyDateLabel(items: CompetitionPhase[]): CompetitionPhase[] {
  return items.map((item) => ({
    ...item,
    dateLabel: normalizeDateLabel(item.date),
  }))
}

function getTimeline(phases: CompetitionPhase[] = [], now = new Date()): TimelineItem[] {
  const normalizedPhases = applyDateLabel(phases)
  if (normalizedPhases.length === 0) return []
  const currentIndex = normalizedPhases.findIndex((item) => now.getTime() < new Date(item.date).getTime())
  const activeIndex = currentIndex === -1 ? normalizedPhases.length - 1 : currentIndex

  return normalizedPhases.map((item, index) => ({
    ...item,
    status: index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'upcoming',
  }))
}

function getCurrentPhase(phases: CompetitionPhase[] = [], now = new Date()): TimelineItem {
  const timeline = getTimeline(phases, now)
  if (timeline.length === 0) return EMPTY_CURRENT_PHASE
  return timeline.find((item) => item.status === 'active') || timeline[timeline.length - 1]
}

type PhaseResponse = {
  data?: CompetitionPhase[]
}

export function useCompetitionPhases() {
  const [phases, setPhases] = useState<CompetitionPhase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const fetchPhases = async () => {
      try {
        const response = await fetch(`${API}/api/v1/phases`, { credentials: 'include' })
        if (!response.ok) {
          if (active) setLoading(false)
          return
        }

        const payload = (await response.json()) as PhaseResponse
        if (!active) return
        setPhases(Array.isArray(payload.data) ? payload.data : [])
      } catch {
        if (active) setPhases([])
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
