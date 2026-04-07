import { access, mkdir, readFile, writeFile } from 'fs/promises'
import { constants as fsConstants } from 'fs'
import path from 'path'
import os from 'os'

export type PhaseConfigItem = {
  key: string
  phase: string
  dateLabel: string
  title: string
  desc: string
  date: string
}

const DEFAULT_PHASES: PhaseConfigItem[] = [
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

const CANDIDATE_CONFIG_PATHS = [
  process.env.PHASE_CONFIG_PATH,
  path.resolve(process.cwd(), 'data', 'phase-config.json'),
  path.resolve(os.tmpdir(), 'geoai-phase-config.json'),
].filter(Boolean) as string[]

let resolvedConfigPath: string | null = null

async function getConfigPath() {
  if (resolvedConfigPath) return resolvedConfigPath

  for (const candidate of CANDIDATE_CONFIG_PATHS) {
    try {
      await mkdir(path.dirname(candidate), { recursive: true })

      // Guard against directories/files that exist but are not writable
      // for the current runtime user (common with bind mounts).
      let fileExists = false
      try {
        await access(candidate, fsConstants.F_OK)
        fileExists = true
      } catch {
        fileExists = false
      }

      if (fileExists) {
        await access(candidate, fsConstants.W_OK)
      } else {
        await access(path.dirname(candidate), fsConstants.W_OK)
      }

      resolvedConfigPath = candidate
      return candidate
    } catch {
      // Try next candidate.
    }
  }

  throw new Error('No writable path available for phase configuration file')
}

function normalizeDateLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date
    .toLocaleString('en-GB', { day: '2-digit', month: 'short' })
    .toUpperCase()
    .replace('.', '')
}

function applyDateLabel(items: PhaseConfigItem[]): PhaseConfigItem[] {
  return items.map((item) => ({
    ...item,
    dateLabel: normalizeDateLabel(item.date),
  }))
}

async function ensureConfigFile() {
  const configPath = await getConfigPath()
  await mkdir(path.dirname(configPath), { recursive: true })

  try {
    await access(configPath, fsConstants.F_OK)
  } catch {
    await writeFile(configPath, JSON.stringify({ phases: applyDateLabel(DEFAULT_PHASES) }, null, 2), 'utf-8')
  }
}

function toValidIso(value: string): string | null {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

export async function getPhaseConfig(): Promise<PhaseConfigItem[]> {
  await ensureConfigFile()
  const configPath = await getConfigPath()

  try {
    const raw = await readFile(configPath, 'utf-8')
    const parsed = JSON.parse(raw) as { phases?: PhaseConfigItem[] }
    const phases = Array.isArray(parsed.phases) && parsed.phases.length > 0 ? parsed.phases : DEFAULT_PHASES

    const normalized = phases.map((phase) => ({
      ...phase,
      date: toValidIso(phase.date) || phase.date,
    }))

    return applyDateLabel(normalized)
  } catch {
    const fallback = applyDateLabel(DEFAULT_PHASES.map((phase) => ({ ...phase, date: toValidIso(phase.date) || phase.date })))
    await writeFile(configPath, JSON.stringify({ phases: fallback }, null, 2), 'utf-8')
    return fallback
  }
}

export async function updatePhaseDates(nextDates: Record<string, string>): Promise<PhaseConfigItem[]> {
  const configPath = await getConfigPath()
  const current = await getPhaseConfig()

  const merged = current.map((phase) => {
    const next = nextDates[phase.key]
    if (!next) return phase
    const normalizedIso = toValidIso(next)
    if (!normalizedIso) return phase
    return {
      ...phase,
      date: normalizedIso,
    }
  })

  await writeFile(configPath, JSON.stringify({ phases: applyDateLabel(merged) }, null, 2), 'utf-8')
  return applyDateLabel(merged)
}

export async function getPhaseByKey(key: string): Promise<PhaseConfigItem | null> {
  const phases = await getPhaseConfig()
  return phases.find((phase) => phase.key === key) || null
}
