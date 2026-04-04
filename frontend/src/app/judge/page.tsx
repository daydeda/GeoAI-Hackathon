'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  History,
  LogOut,
  Save,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useAlert } from '@/contexts/AlertContext'
import AppShell from '@/components/AppShell'
import { formatPhaseDeadline, getCurrentPhase } from '@/lib/competitionPhase'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type Tab = 'QUEUE' | 'PAST_REVIEWS' | 'SETTINGS'

interface Team {
  name: string
  track: string
}

interface FileItem {
  id: string
  originalName: string
}

interface JudgeScore {
  nationalImpactScore: number
  technologyMethodologyScore: number
  requirementComplianceScore: number
  feasibilityScore: number
  comments?: string
}

interface ScoreAggregate {
  totalWeighted: number
  judgeCount: number
}

interface Submission {
  id: string
  submittedAt: string
  team: Team
  files: FileItem[]
  judgeScores: JudgeScore[]
  scoreAggregate?: ScoreAggregate | null
  abstract?: string
}

const TRACK_LABELS: Record<string, string> = {
  SMART_AGRICULTURE: 'Smart Agriculture',
  DISASTER_FLOOD_RESPONSE: 'Disaster & Flood Response',
}

function formatTrackLabel(track: string) {
  return TRACK_LABELS[track] || track.replace(/_/g, ' ')
}

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function JudgeContent() {
  const { user, logout } = useAuth()
  const { showAlert } = useAlert()

  const [queue, setQueue] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('QUEUE')
  const [activeSubId, setActiveSubId] = useState<string | null>(null)

  const [scores, setScores] = useState({
    nationalImpactScore: 0,
    technologyMethodologyScore: 0,
    requirementComplianceScore: 0,
    feasibilityScore: 0,
  })
  const [comments, setComments] = useState('')
  const [saving, setSaving] = useState(false)
  const currentPhase = getCurrentPhase()
  const phaseDeadline = formatPhaseDeadline(currentPhase.date)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/judge/submissions?limit=50`, { credentials: 'include' })
      if (!res.ok) {
        showAlert('Failed to load evaluation queue', 'warning')
        return
      }
      const data = await res.json()
      setQueue(data.data || [])
    } catch {
      showAlert('Failed to load evaluation queue', 'error')
    } finally {
      setLoading(false)
    }
  }, [showAlert])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const unscoredQueue = useMemo(
    () => queue.filter((item) => !item.judgeScores || item.judgeScores.length === 0),
    [queue],
  )

  const scoredQueue = useMemo(
    () => queue.filter((item) => item.judgeScores && item.judgeScores.length > 0),
    [queue],
  )

  const currentTabQueue = activeTab === 'QUEUE' ? unscoredQueue : scoredQueue
  const activeSubmission = currentTabQueue.find((item) => item.id === activeSubId) || null

  useEffect(() => {
    const first = currentTabQueue[0]?.id || null
    if (!activeSubId || !currentTabQueue.some((item) => item.id === activeSubId)) {
      setActiveSubId(first)
    }
  }, [currentTabQueue, activeSubId])

  useEffect(() => {
    const existing = activeSubmission?.judgeScores?.[0]
    if (existing) {
      setScores({
        nationalImpactScore: existing.nationalImpactScore,
        technologyMethodologyScore: existing.technologyMethodologyScore,
        requirementComplianceScore: existing.requirementComplianceScore,
        feasibilityScore: existing.feasibilityScore,
      })
      setComments(existing.comments || '')
      return
    }

    setScores({
      nationalImpactScore: 0,
      technologyMethodologyScore: 0,
      requirementComplianceScore: 0,
      feasibilityScore: 0,
    })
    setComments('')
  }, [activeSubmission])

  const weightedScore =
    scores.nationalImpactScore * 0.4 +
    scores.technologyMethodologyScore * 0.3 +
    scores.requirementComplianceScore * 0.15 +
    scores.feasibilityScore * 0.15

  const submitScore = async () => {
    if (!activeSubmission) return

    setSaving(true)
    try {
      const res = await fetch(`${API}/api/v1/judge/submissions/${activeSubmission.id}/scores`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scores, comments }),
      })

      if (!res.ok) {
        showAlert('Unable to save score. Please try again.', 'warning')
        return
      }

      showAlert(activeTab === 'PAST_REVIEWS' ? 'Review updated.' : 'Review submitted.', 'info')
      await fetchQueue()
      if (activeTab === 'QUEUE') setActiveTab('PAST_REVIEWS')
    } catch {
      showAlert('Unexpected error while saving score.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const statusCard = [
    { label: 'Pending Reviews', value: unscoredQueue.length, icon: ClipboardList },
    { label: 'Completed Reviews', value: scoredQueue.length, icon: CheckCircle2 },
    { label: 'Current Phase', value: currentPhase.title, sub: `Deadline ${phaseDeadline}`, icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-(--bg-base) px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <header className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-display text-2xl text-white sm:text-3xl">Evaluation Queue</h1>
              <p className="mt-1 text-sm text-(--text-secondary)">
                Standardized rubric scoring with independent judge submissions and automatic averaging.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-(--text-muted)">
              <ShieldCheck size={16} className="text-(--accent-cyan)" />
              <span>{user?.roles?.[0] || 'JUDGE'}</span>
              <button
                type="button"
                onClick={logout}
                className="ml-2 inline-flex items-center gap-2 rounded border border-(--border-subtle) px-3 py-1.5 text-(--text-secondary) hover:text-white"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {statusCard.map((card) => (
            <div key={card.label} className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-4">
              <div className="mb-2 flex items-center gap-2 text-(--text-muted)">
                <card.icon size={15} />
                <span className="text-xs uppercase tracking-[0.08em]">{card.label}</span>
              </div>
              <div className="font-display text-3xl text-(--accent-cyan)">{card.value}</div>
              {'sub' in card && card.sub && <div className="mt-1 text-[11px] text-(--text-muted)">{card.sub}</div>}
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)_380px]">
          <aside className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-4">
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('QUEUE')}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-xs font-semibold ${
                  activeTab === 'QUEUE'
                    ? 'bg-(--accent-cyan) text-black'
                    : 'border border-(--border-subtle) text-(--text-secondary)'
                }`}
              >
                <ClipboardList size={14} /> Queue
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PAST_REVIEWS')}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-xs font-semibold ${
                  activeTab === 'PAST_REVIEWS'
                    ? 'bg-(--accent-cyan) text-black'
                    : 'border border-(--border-subtle) text-(--text-secondary)'
                }`}
              >
                <History size={14} /> Past
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SETTINGS')}
                className={`inline-flex items-center justify-center rounded px-3 py-2 text-xs font-semibold ${
                  activeTab === 'SETTINGS'
                    ? 'bg-(--accent-cyan) text-black'
                    : 'border border-(--border-subtle) text-(--text-secondary)'
                }`}
              >
                <Settings size={14} />
              </button>
            </div>

            {activeTab === 'SETTINGS' ? (
              <div className="text-sm text-(--text-secondary)">
                This workspace uses a fixed scoring rubric with weights: 40% National Impact, 30% Technology & Methodology, 15% Requirement Compliance, and 15% Feasibility.
              </div>
            ) : (
              <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
                {loading && <div className="text-xs text-(--text-muted)">Loading queue...</div>}
                {!loading && currentTabQueue.length === 0 && (
                  <div className="text-xs text-(--text-muted)">No submissions in this tab.</div>
                )}
                {currentTabQueue.map((item) => {
                  const active = item.id === activeSubId
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setActiveSubId(item.id)}
                      className={`w-full rounded border px-3 py-3 text-left transition ${
                        active
                          ? 'border-(--accent-cyan) bg-[rgba(0,229,255,0.08)]'
                          : 'border-(--border-subtle) bg-(--bg-base) hover:border-(--accent-cyan)'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-[0.08em] text-(--text-muted)">
                        {formatTrackLabel(item.team.track)}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">{item.team.name}</div>
                      <div className="mt-1 text-[11px] text-(--text-muted)">
                        {new Date(item.submittedAt).toLocaleString()}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </aside>

          <section className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
            {!activeSubmission || activeTab === 'SETTINGS' ? (
              <div className="flex min-h-[420px] items-center justify-center text-(--text-muted)">
                Select a submission to begin evaluation.
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded border border-(--accent-green) bg-[rgba(0,230,118,0.08)] px-2.5 py-1 text-[11px] font-semibold text-(--accent-green)">
                    {formatTrackLabel(activeSubmission.team.track)}
                  </span>
                  <span className="text-xs text-(--text-muted)">
                    Submitted {new Date(activeSubmission.submittedAt).toLocaleString()}
                  </span>
                </div>

                <h2 className="font-display text-2xl text-white">{activeSubmission.team.name}</h2>
                <p className="mt-2 text-sm text-(--text-secondary)">
                  Review proposal materials and apply the scoring rubric consistently.
                </p>

                <div className="mt-5 rounded border border-(--border-subtle) bg-(--bg-base) p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-white">
                    <FileText size={16} className="text-(--accent-cyan)" />
                    Proposal Document
                  </div>
                  <a
                    href={`${API}/api/v1/submissions/${activeSubmission.id}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded border border-(--accent-cyan) px-3 py-1.5 text-xs text-(--accent-cyan) no-underline"
                  >
                    Open PDF
                  </a>
                  {activeSubmission.files[0]?.originalName && (
                    <div className="mt-2 text-xs text-(--text-muted)">{activeSubmission.files[0].originalName}</div>
                  )}
                </div>

                <div className="mt-5 rounded border border-(--border-subtle) bg-(--bg-base) p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.08em] text-(--text-muted)">Abstract</div>
                  <div className="max-h-[260px] overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-(--text-secondary)">
                    {activeSubmission.abstract || 'No abstract summary available. Please review the proposal document.'}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
            {activeTab === 'SETTINGS' || !activeSubmission ? (
              <div className="text-sm text-(--text-secondary)">
                Rubric settings are managed by organizers.
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                    <Gauge size={16} className="text-(--accent-cyan)" />
                    Rubric Scoring
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-(--text-muted)">Your Weighted Score</div>
                    <div className="font-display text-3xl text-(--accent-green)">{weightedScore.toFixed(1)}</div>
                  </div>
                </div>

                {activeSubmission.scoreAggregate && (
                  <div className="mb-4 rounded border border-(--border-subtle) bg-(--bg-base) p-3 text-xs text-(--text-secondary)">
                    Current final average: <span className="text-white">{activeSubmission.scoreAggregate.totalWeighted.toFixed(2)}</span>
                    {' · '}
                    Judges submitted: <span className="text-white">{activeSubmission.scoreAggregate.judgeCount}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {[
                    { key: 'nationalImpactScore', label: 'National Impact', weight: 40 },
                    { key: 'technologyMethodologyScore', label: 'Technology & Methodology', weight: 30 },
                    { key: 'requirementComplianceScore', label: 'Requirement Compliance', weight: 15 },
                    { key: 'feasibilityScore', label: 'Feasibility', weight: 15 },
                  ].map((criterion) => (
                    <div key={criterion.key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <label className="font-semibold text-(--text-secondary)">{criterion.label}</label>
                        <span className="text-(--text-muted)">{criterion.weight}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={scores[criterion.key as keyof typeof scores]}
                          onChange={(event) =>
                            setScores((prev) => ({
                              ...prev,
                              [criterion.key]: clampScore(Number(event.target.value)),
                            }))
                          }
                          className="w-full accent-(--accent-cyan)"
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={scores[criterion.key as keyof typeof scores]}
                          onChange={(event) =>
                            setScores((prev) => ({
                              ...prev,
                              [criterion.key]: clampScore(Number(event.target.value)),
                            }))
                          }
                          className="w-16 rounded border border-(--border-subtle) bg-(--bg-base) px-2 py-1 text-right text-sm text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-(--text-secondary)">
                    Reviewer Notes
                  </label>
                  <textarea
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                    className="min-h-[120px] w-full rounded border border-(--border-subtle) bg-(--bg-base) p-3 text-sm text-white outline-none"
                    placeholder="Write clear justification for your score."
                  />
                </div>

                <button
                  type="button"
                  onClick={submitScore}
                  disabled={saving}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded bg-(--accent-cyan) px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : activeTab === 'PAST_REVIEWS' ? 'Update Score' : 'Submit Score'}
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default function JudgePage() {
  return (
    <AuthProvider>
      <AppShell>
        <JudgeContent />
      </AppShell>
    </AuthProvider>
  )
}
