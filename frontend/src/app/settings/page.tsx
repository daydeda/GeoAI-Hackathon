'use client'

import { FormEvent, useEffect, useMemo, useState, useCallback } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { Lock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type FormState = {
  firstName: string
  lastName: string
  experience: string
  university: string
  yearOfStudy: string
  phoneNumber: string
  address: string
}

function parseProfileError(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Profile update failed'
  const data = payload as { error?: unknown; message?: unknown; locked?: boolean }
  if (typeof data.error === 'string') return data.error
  if (typeof data.message === 'string') return data.message
  if (data.error && typeof data.error === 'object') {
    const zodError = data.error as {
      fieldErrors?: Record<string, string[]>
      formErrors?: string[]
    }
    const formErrors = zodError.formErrors || []
    const fieldErrors = Object.entries(zodError.fieldErrors || {})
      .flatMap(([field, messages]) => (messages || []).map((msg) => `${field}: ${msg}`))
    const allErrors = [...formErrors, ...fieldErrors].filter(Boolean)
    if (allErrors.length > 0) return allErrors.join(' | ')
  }
  return 'Profile update failed'
}

const REQUIRED_FIELDS: Array<{ key: keyof FormState; label: string; multiline?: boolean; inputType?: string; min?: number; max?: number; optional?: boolean }> = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'university', label: 'University' },
  { key: 'yearOfStudy', label: 'Year of Study', inputType: 'number', min: 1, max: 12 },
  { key: 'phoneNumber', label: 'Phone Number' },
  { key: 'address', label: 'Address', multiline: true },
  { key: 'experience', label: 'Experience (Optional)', multiline: true, optional: true },
]

function SettingsContent() {
  const { user, refetch } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [profileLocked, setProfileLocked] = useState(false)
  const [lockReason, setLockReason] = useState<string>('')

  const [form, setForm] = useState<FormState>({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    experience: user?.profile?.experience || '',
    university: user?.profile?.university || '',
    yearOfStudy: user?.profile?.yearOfStudy ? String(user.profile.yearOfStudy) : '',
    phoneNumber: user?.profile?.phoneNumber || '',
    address: user?.profile?.address || '',
  })

  // Reset form when user loads in
  useEffect(() => {
    if (user?.profile) {
      setForm({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        experience: user.profile.experience || '',
        university: user.profile.university || '',
        yearOfStudy: user.profile.yearOfStudy ? String(user.profile.yearOfStudy) : '',
        phoneNumber: user.profile.phoneNumber || '',
        address: user.profile.address || '',
      })
    }
  }, [user])

  // Check if profile is locked (verified competitor status)
  useEffect(() => {
    if (user?.competitorStatus === 'VERIFIED_COMPETITOR') {
      setProfileLocked(true)
      setLockReason('Your application has been verified. Profile editing is no longer available.')
    }
  }, [user])

  // Check submission deadline lock via API probe
  const checkDeadlineLock = useCallback(async () => {
    if (profileLocked) return
    try {
      // Probe the endpoint with an empty request to detect a deadline lock
      const res = await fetch(`${API}/api/v1/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        // intentionally minimal — we just want the 403 lock response if present
        body: new FormData(),
      })
      if (res.status === 403) {
        const data = await res.json().catch(() => ({})) as { locked?: boolean; reason?: string; error?: string }
        if (data.locked) {
          setProfileLocked(true)
          setLockReason(data.error || 'Profile editing is currently locked.')
        }
      }
    } catch {
      // silently ignore
    }
  }, [profileLocked])

  useEffect(() => {
    checkDeadlineLock()
  }, [checkDeadlineLock])

  // Compute which required fields are missing
  const missingFields = useMemo(() => {
    const missing = new Set<keyof FormState>()
    for (const f of REQUIRED_FIELDS) {
      if (!f.optional && !form[f.key]?.trim()) missing.add(f.key)
    }
    return missing
  }, [form])

  const hasStudentId = useMemo(() => Boolean(user?.profile?.idCardFileUploaded), [user?.profile?.idCardFileUploaded])
  const settingsProfileCompleted = missingFields.size === 0 && hasStudentId

  const competitorStatus = user?.competitorStatus
  const moderatorNote = user?.moderatorNote

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (profileLocked) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('firstName', form.firstName)
      formData.append('lastName', form.lastName)
      formData.append('experience', form.experience)
      formData.append('university', form.university)
      formData.append('yearOfStudy', form.yearOfStudy)
      formData.append('phoneNumber', form.phoneNumber)
      formData.append('address', form.address)
      if (idCardFile) formData.append('idCard', idCardFile)

      const response = await fetch(`${API}/api/v1/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        const p = payload as { locked?: boolean; error?: string }
        if (p.locked) {
          setProfileLocked(true)
          setLockReason(p.error || 'Profile editing is locked.')
          return
        }
        throw new Error(parseProfileError(payload))
      }

      setSuccess('Profile updated successfully. Your changes are pending review.')
      setIdCardFile(null)
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed')
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = (key: keyof FormState, extra = '') =>
    `rounded border bg-(--bg-base) px-3 py-2 text-sm outline-none transition ${
      missingFields.has(key) && !profileLocked
        ? 'border-[var(--accent-red)] text-white'
        : 'border-(--border-subtle) text-white'
    } ${profileLocked ? 'opacity-60 cursor-not-allowed' : ''} ${extra}`

  const statusBadge = () => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      PENDING: { label: 'Pending Review', color: 'var(--accent-amber)', bg: 'rgba(255,167,38,0.1)' },
      VERIFIED_COMPETITOR: { label: 'Verified Competitor', color: 'var(--accent-green)', bg: 'rgba(0,230,118,0.1)' },
      INCORRECT_COMPETITOR: { label: 'Incorrect — Action Required', color: '#ff6275', bg: 'rgba(255,98,117,0.1)' },
      QUALIFIED: { label: 'Qualified Finalist', color: 'var(--accent-cyan)', bg: 'rgba(0,229,255,0.1)' },
      DISQUALIFIED: { label: 'Disqualified', color: '#ff6275', bg: 'rgba(255,98,117,0.08)' },
    }
    const s = competitorStatus ? map[competitorStatus] : map.PENDING
    return s ?? map.PENDING
  }

  const badge = statusBadge()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white sm:text-4xl">Profile Settings</h1>
          <p className="mt-2 text-sm text-(--text-secondary)">
            Edit your profile information and upload/update your Student ID file.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Profile completion badge */}
          <div className="rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-xs text-(--text-secondary)">
            Profile Status:{' '}
            <span className={settingsProfileCompleted ? 'text-(--accent-green)' : 'text-(--accent-amber)'}>
              {settingsProfileCompleted ? 'Completed' : 'Pending'}
            </span>
          </div>
          {/* Competitor status badge */}
          {competitorStatus && (
            <div
              className="rounded border px-3 py-1.5 text-xs font-semibold tracking-wide"
              style={{ color: badge.color, borderColor: badge.color, background: badge.bg }}
            >
              {badge.label}
            </div>
          )}
        </div>
      </div>

      {/* Moderator note callout (INCORRECT_COMPETITOR) */}
      {competitorStatus === 'INCORRECT_COMPETITOR' && moderatorNote && (
        <div className="mb-5 flex gap-3 rounded-lg border border-[rgba(255,98,117,0.4)] bg-[rgba(255,98,117,0.08)] p-4">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[#ff6275]" />
          <div>
            <div className="mb-1 text-xs font-bold tracking-[0.06em] text-[#ff6275]">MODERATOR REVIEW — ACTION REQUIRED</div>
            <p className="text-sm leading-relaxed text-(--text-secondary)">
              Your submission was flagged. Please review the reason below and update your profile accordingly before resubmitting.
            </p>
            <div className="mt-2 rounded border border-[rgba(255,98,117,0.3)] bg-[rgba(5,13,26,0.5)] px-3 py-2 text-sm italic text-(--text-secondary)">
              &quot;{moderatorNote}&quot;
            </div>
          </div>
        </div>
      )}

      {/* Pending Review indicator */}
      {competitorStatus === 'PENDING' && (
        <div className="mb-5 flex gap-3 rounded-lg border border-[rgba(255,167,38,0.4)] bg-[rgba(255,167,38,0.08)] p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-(--accent-amber)" />
          <div>
            <div className="mb-1 text-xs font-bold tracking-[0.06em] text-(--accent-amber)">PENDING REVIEW</div>
            <p className="text-sm leading-relaxed text-(--text-secondary)">
              Your changes were saved successfully and are currently awaiting moderator approval.
            </p>
          </div>
        </div>
      )}

      {/* Lock banner */}
      {profileLocked && (
        <div className="mb-5 flex gap-3 rounded-lg border border-[rgba(255,171,0,0.35)] bg-[rgba(255,171,0,0.07)] p-4">
          <Lock size={16} className="mt-0.5 shrink-0 text-(--accent-amber)" />
          <div>
            <div className="mb-1 text-xs font-bold tracking-[0.06em] text-(--accent-amber)">PROFILE EDITING LOCKED</div>
            <p className="text-sm text-(--text-secondary)">{lockReason}</p>
          </div>
        </div>
      )}

      {/* Missing fields warning */}
      {!profileLocked && missingFields.size > 0 && (
        <div className="mb-5 flex gap-3 rounded-lg border border-[rgba(255,167,38,0.3)] bg-[rgba(255,167,38,0.06)] p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-(--accent-amber)" />
          <div>
            <div className="mb-1 text-xs font-bold tracking-[0.06em] text-(--accent-amber)">MISSING REQUIRED FIELDS</div>
            <p className="text-sm text-(--text-secondary)">
              The fields highlighted in red must be completed before your profile can be submitted.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 shadow-[0_20px_40px_rgba(0,0,0,0.25)] sm:p-6">
        {error && <div className="mb-4 rounded border border-(--accent-red) bg-[rgba(255,23,68,0.1)] px-3 py-2 text-xs text-(--accent-red)">{error}</div>}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded border border-(--accent-green) bg-[rgba(0,230,118,0.1)] px-3 py-2 text-xs text-(--accent-green)">
            <CheckCircle size={13} /> {success}
          </div>
        )}

        <div className="mb-3 text-xs font-semibold tracking-[0.08em] text-(--text-muted)">PROFILE INFORMATION</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REQUIRED_FIELDS.map((f) => {
            const missing = missingFields.has(f.key) && !profileLocked
            const labelEl = (
              <label key={`label-${f.key}`} className={`block text-xs font-medium mb-1 ${missing ? 'text-(--accent-red)' : 'text-(--text-muted)'}`}>
                {f.label}{missing && <span className="ml-1 text-[10px] font-bold">— Missing Information</span>}
              </label>
            )
            const commonProps = {
              disabled: profileLocked,
              value: form[f.key],
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setForm((prev) => ({ ...prev, [f.key]: e.target.value })),
            }
            if (f.multiline) {
              return (
                <div key={f.key} className={f.key === 'experience' || f.key === 'address' ? 'sm:col-span-2' : ''}>
                  {labelEl}
                  <textarea
                    {...commonProps}
                    placeholder={f.label}
                    className={fieldClass(f.key, 'min-h-24 w-full')}
                  />
                </div>
              )
            }
            return (
              <div key={f.key} className={f.key === 'phoneNumber' ? 'sm:col-span-2' : ''}>
                {labelEl}
                <input
                  {...commonProps}
                  type={f.inputType || 'text'}
                  min={f.min}
                  max={f.max}
                  placeholder={f.label}
                  className={fieldClass(f.key, 'w-full')}
                />
              </div>
            )
          })}
        </div>

        {/* Student ID upload */}
        <div className="mt-5 rounded border border-(--border-subtle) bg-(--bg-base) p-4">
          <div className="mb-2 text-xs font-semibold tracking-[0.08em] text-(--text-muted)">STUDENT ID</div>
          <div className="mb-3 text-xs text-(--text-secondary)">
            Student ID File Status:{' '}
            <span className={user?.profile?.idCardFileUploaded ? 'text-(--accent-green)' : 'text-(--accent-red)'}>
              {user?.profile?.idCardFileUploaded ? 'Uploaded' : (
                <span className="font-semibold">Missing — Required</span>
              )}
            </span>
          </div>
          <label className="mb-2 block text-xs text-(--text-secondary)">Upload Student ID (JPG/PNG/PDF, max 5MB)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            disabled={profileLocked}
            onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
            className={`block w-full text-xs ${profileLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
          {idCardFile && <div className="mt-2 text-[11px] text-(--accent-cyan)">Selected: {idCardFile.name}</div>}
          <p className="mt-2 text-[11px] text-(--text-muted)">
            All team members must upload their Student ID before proposal submission.
          </p>
        </div>

        {!profileLocked && (
          <button
            type="submit"
            disabled={saving}
            className="mt-5 rounded bg-(--accent-cyan) px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            {saving ? 'Saving...' : settingsProfileCompleted ? 'Save Changes' : 'Complete Profile'}
          </button>
        )}
      </form>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AuthProvider>
      <AppShell>
        <SettingsContent />
      </AppShell>
    </AuthProvider>
  )
}
