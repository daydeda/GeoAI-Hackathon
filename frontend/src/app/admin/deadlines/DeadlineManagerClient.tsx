'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { AuthProvider } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAlert } from '@/contexts/AlertContext'
import AppShell from '@/components/AppShell'
import { useCompetitionPhases } from '@/hooks/useCompetitionPhases'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

function parseDisplayDate(value: string): Date | null {
  const trimmed = value.trim()
  if (!/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return null

  const [dayText, monthText, yearText] = trimmed.split('-')
  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)

  const date = new Date(year, month - 1, day)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

function buildMonthGrid(monthDate: Date): Array<number | null> {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const leadingBlankCount = firstDay.getDay()

  const grid: Array<number | null> = []
  for (let i = 0; i < leadingBlankCount; i += 1) grid.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) grid.push(day)
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

function DeadlineManagerContent() {
  const { phases } = useCompetitionPhases()
  const { user } = useAuth()
  const { showAlert } = useAlert()
  const [saving, setSaving] = useState(false)
  const [activeCalendar, setActiveCalendar] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState<Record<string, Date>>({})
  const [draft, setDraft] = useState<Record<string, { dateText: string; timeText: string }>>({})

  const mergedPhases = useMemo(
    () => phases.map((phase) => {
      const date = new Date(phase.date)
      const currentDate = Number.isNaN(date.getTime())
        ? ''
        : formatDisplayDate(date)
      const currentTime = Number.isNaN(date.getTime())
        ? ''
        : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

      const draftValue = draft[phase.key]

      return {
        ...phase,
        dateText: draftValue?.dateText ?? currentDate,
        timeText: draftValue?.timeText ?? currentTime,
      }
    }),
    [draft, phases],
  )

  const buildIsoDate = (dateText: string, timeText: string) => {
    const dateValue = parseDisplayDate(dateText)
    const normalizedTime = timeText.trim()
    if (!/^\d{2}:\d{2}$/.test(normalizedTime)) return null

    if (!dateValue) return null

    const [hourText, minuteText] = normalizedTime.split(':')
    const parsed = new Date(
      dateValue.getFullYear(),
      dateValue.getMonth(),
      dateValue.getDate(),
      Number(hourText),
      Number(minuteText),
      0,
      0,
    )

    if (Number.isNaN(parsed.getTime())) return null
    return parsed.toISOString()
  }

  const saveDeadlines = async () => {
    setSaving(true)

    try {
      const converted = mergedPhases.map((phase) => {
        const iso = buildIsoDate(phase.dateText, phase.timeText)
        return {
          key: phase.key,
          date: iso,
          dateText: phase.dateText,
          timeText: phase.timeText,
        }
      })

      const invalid = converted.find((item) => !item.date)
      if (invalid) {
        showAlert(`Invalid date/time for ${invalid.key}. Use DD-MM-YYYY and HH:mm format.`, 'error')
        return
      }

      const payload = {
        phases: converted.map((item) => ({
          key: item.key,
          date: item.date as string,
        })),
      }

      const response = await fetch(`${API}/api/v1/admin/phases`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string; message?: string }
        showAlert(data.message || data.error || 'Failed to update phase deadlines', 'error')
        return
      }

      const phaseUpdateStamp = String(Date.now())
      localStorage.setItem('geoai-phases-updated-at', phaseUpdateStamp)
      window.dispatchEvent(new CustomEvent('geoai:phases-updated', { detail: { at: phaseUpdateStamp } }))

      showAlert('Phase deadlines updated successfully', 'info')
      setDraft({})
    } catch {
      showAlert('Failed to update phase deadlines', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!user?.roles?.some((role) => role === 'ADMIN' || role === 'MODERATOR')) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl text-white sm:text-4xl">Phase Deadline Management</h1>
        <p className="mt-3 text-sm text-(--text-secondary)">
          You do not have permission to edit global phase deadlines.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-white sm:text-4xl">Phase Deadline Management</h1>
        <p className="mt-2 text-sm text-(--text-secondary)">
          Single-page editor. Changes are applied globally and update Current Phase cards, dashboard countdowns, and landing protocol timeline.
        </p>
      </div>

      <div className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4">
          {mergedPhases.map((phase) => (
            <div key={phase.key} className="rounded border border-(--border-subtle) bg-(--bg-base) p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_1fr] md:items-end">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.08em] text-(--text-muted)">{phase.phase}</div>
                  <div className="mt-1 text-lg font-semibold text-white">{phase.title}</div>
                </div>

                <div className="relative">
                  <label className="mb-2 block text-xs text-(--text-secondary)">Date (DD-MM-YYYY)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCalendar((prev) => (prev === phase.key ? null : phase.key))
                      setCalendarMonth((prev) => {
                        if (prev[phase.key]) return prev
                        const parsed = parseDisplayDate(phase.dateText)
                        return { ...prev, [phase.key]: parsed || new Date() }
                      })
                    }}
                    className="inline-flex w-full items-center justify-between rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-sm text-white"
                  >
                    <span>{phase.dateText || 'Select date'}</span>
                    <CalendarDays size={16} className="text-(--accent-cyan)" />
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-(--text-secondary)">Time (HH:mm)</label>
                  <input
                    type="text"
                    value={phase.timeText}
                    onChange={(event) => {
                      setDraft((prev) => ({
                        ...prev,
                        [phase.key]: {
                          dateText: prev[phase.key]?.dateText ?? phase.dateText,
                          timeText: event.target.value,
                        },
                      }))
                    }}
                    placeholder="23:59"
                    className="w-full rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              {activeCalendar === phase.key && (
                <div className="mt-3 rounded border border-(--border-subtle) bg-(--bg-surface) p-3 shadow-[0_20px_40px_rgba(0,0,0,0.35)] sm:max-w-[320px]">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const current = calendarMonth[phase.key] || new Date()
                        setCalendarMonth((prev) => ({
                          ...prev,
                          [phase.key]: new Date(current.getFullYear(), current.getMonth() - 1, 1),
                        }))
                      }}
                      className="rounded border border-(--border-subtle) p-1 text-(--text-secondary)"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="text-xs font-semibold text-white">
                      {(calendarMonth[phase.key] || new Date()).toLocaleString('en-GB', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const current = calendarMonth[phase.key] || new Date()
                        setCalendarMonth((prev) => ({
                          ...prev,
                          [phase.key]: new Date(current.getFullYear(), current.getMonth() + 1, 1),
                        }))
                      }}
                      className="rounded border border-(--border-subtle) p-1 text-(--text-secondary)"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-(--text-muted)">
                    {WEEKDAY_LABELS.map((day) => (
                      <div key={day} className="py-1">{day}</div>
                    ))}
                  </div>

                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {buildMonthGrid(calendarMonth[phase.key] || new Date()).map((day, index) => {
                      if (!day) return <div key={`empty-${index}`} className="h-8" />

                      const current = calendarMonth[phase.key] || new Date()
                      const selected = (() => {
                        const parsed = parseDisplayDate(phase.dateText)
                        return (
                          parsed &&
                          parsed.getFullYear() === current.getFullYear() &&
                          parsed.getMonth() === current.getMonth() &&
                          parsed.getDate() === day
                        )
                      })()

                      return (
                        <button
                          key={`${phase.key}-${day}`}
                          type="button"
                          onClick={() => {
                            const pickedDate = new Date(current.getFullYear(), current.getMonth(), day)
                            setDraft((prev) => ({
                              ...prev,
                              [phase.key]: {
                                dateText: formatDisplayDate(pickedDate),
                                timeText: prev[phase.key]?.timeText ?? phase.timeText,
                              },
                            }))
                            setActiveCalendar(null)
                          }}
                          className={`h-8 rounded text-xs ${selected ? 'bg-(--accent-cyan) text-black' : 'text-white hover:bg-(--bg-base)'}`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date()
                        setCalendarMonth((prev) => ({
                          ...prev,
                          [phase.key]: new Date(now.getFullYear(), now.getMonth(), 1),
                        }))
                      }}
                      className="rounded border border-(--border-subtle) px-3 py-1.5 text-xs text-(--text-secondary)"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCalendar(null)}
                      className="rounded border border-(--border-subtle) px-3 py-1.5 text-xs text-(--text-secondary)"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={saveDeadlines}
          disabled={saving}
          className="mt-5 inline-flex items-center justify-center rounded bg-(--accent-cyan) px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Deadlines'}
        </button>
      </div>
    </div>
  )
}

export default function DeadlineManagerPage() {
  return (
    <AuthProvider>
      <AppShell>
        <DeadlineManagerContent />
      </AppShell>
    </AuthProvider>
  )
}
