export type TimelineStatus = 'done' | 'active' | 'upcoming'

export type CompetitionPhase = {
  key: string
  phase: string
  dateLabel: string
  title: string
  desc: string
  date: string
}

export const DEFAULT_COMPETITION_PHASES: CompetitionPhase[] = [
  {
    key: 'registration',
    phase: 'PHASE 01',
    dateLabel: '',
    title: 'Registration',
    desc: 'Team registration window closed on 29 April.',
    date: '2026-03-31T23:59:59+07:00',
  },
  {
    key: 'proposal-submission',
    phase: 'PHASE 02',
    dateLabel: '29 APR',
    title: 'Proposal Submission',
    desc: 'Proposal submission deadline is April 29 (PDF, max 20 MB).',
    date: '2026-04-29T23:59:59+07:00',
  },
  {
    key: 'announcement',
    phase: 'PHASE 03',
    dateLabel: '08 MAY',
    title: 'Announcement',
    desc: 'Announcement will be released on 8 May.',
    date: '2026-05-08T00:00:00+07:00',
  },
  {
    key: 'development',
    phase: 'PHASE 04',
    dateLabel: '15 MAY',
    title: 'Development',
    desc: 'Mockup date: 15 May (adjustable).',
    date: '2026-05-15T09:00:00+07:00',
  },
  {
    key: 'final-pitching',
    phase: 'PHASE 05',
    dateLabel: '22 MAY',
    title: 'Final Pitching',
    desc: 'Mockup date: 22 May (adjustable).',
    date: '2026-05-22T09:00:00+07:00',
  },
]

export type TimelineItem = CompetitionPhase & {
  status: TimelineStatus
}

export function getTimeline(phases: CompetitionPhase[] = DEFAULT_COMPETITION_PHASES, now = new Date()): TimelineItem[] {
  if (phases.length === 0) return []
  const currentIndex = phases.findIndex((item) => now.getTime() < new Date(item.date).getTime())
  const activeIndex = currentIndex === -1 ? phases.length - 1 : currentIndex

  return phases.map((item, index) => ({
    ...item,
    status: index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'upcoming',
  }))
}

export function getCurrentPhase(phases: CompetitionPhase[] = DEFAULT_COMPETITION_PHASES, now = new Date()): TimelineItem {
  const timeline = getTimeline(phases, now)
  if (timeline.length === 0) {
    return {
      ...DEFAULT_COMPETITION_PHASES[DEFAULT_COMPETITION_PHASES.length - 1],
      status: 'active',
    }
  }
  return timeline.find((item) => item.status === 'active') || timeline[timeline.length - 1]
}

export function formatPhaseDeadline(dateIso: string): string {
  const date = new Date(dateIso)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function getPhaseByKey(phases: CompetitionPhase[], key: string): CompetitionPhase | null {
  return phases.find((phase) => phase.key === key) || null
}
