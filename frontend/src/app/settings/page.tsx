'use client'

import { FormEvent, useMemo, useState } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type FormState = {
  firstName: string
  lastName: string
  university: string
  yearOfStudy: string
  phoneNumber: string
  address: string
}

function parseProfileError(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Profile update failed'

  const data = payload as {
    error?: unknown
    message?: unknown
  }

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

function SettingsContent() {
  const { user, refetch } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [idCardFile, setIdCardFile] = useState<File | null>(null)

  const [form, setForm] = useState<FormState>({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    university: user?.profile?.university || '',
    yearOfStudy: user?.profile?.yearOfStudy ? String(user.profile.yearOfStudy) : '',
    phoneNumber: user?.profile?.phoneNumber || '',
    address: user?.profile?.address || '',
  })

  const hasProfile = useMemo(() => Boolean(user?.profileCompleted), [user?.profileCompleted])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('firstName', form.firstName)
      formData.append('lastName', form.lastName)
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
        throw new Error(parseProfileError(payload))
      }

      setSuccess('Profile updated successfully.')
      setIdCardFile(null)
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white sm:text-4xl">Profile Settings</h1>
          <p className="mt-2 text-sm text-(--text-secondary)">
            Edit your profile information and upload/update your Student ID file.
          </p>
        </div>
        <div className="rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-xs text-(--text-secondary)">
          Profile Status:{' '}
          <span className={hasProfile ? 'text-(--accent-green)' : 'text-(--accent-amber)'}>
            {hasProfile ? 'Completed' : 'Pending'}
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 shadow-[0_20px_40px_rgba(0,0,0,0.25)] sm:p-6">
        {error && <div className="mb-4 rounded border border-(--accent-red) bg-[rgba(255,23,68,0.1)] px-3 py-2 text-xs text-(--accent-red)">{error}</div>}
        {success && <div className="mb-4 rounded border border-(--accent-green) bg-[rgba(0,230,118,0.1)] px-3 py-2 text-xs text-(--accent-green)">{success}</div>}

        <div className="mb-3 text-xs font-semibold tracking-[0.08em] text-(--text-muted)">PROFILE INFORMATION</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required placeholder="First Name" value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} className="rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-sm" />
          <input required placeholder="Last Name" value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} className="rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-sm" />
          <input required placeholder="University" value={form.university} onChange={(e) => setForm((prev) => ({ ...prev, university: e.target.value }))} className="rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-sm" />
          <input required type="number" min={1} max={12} placeholder="Year of Study" value={form.yearOfStudy} onChange={(e) => setForm((prev) => ({ ...prev, yearOfStudy: e.target.value }))} className="rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-sm" />
          <input required placeholder="Phone Number" value={form.phoneNumber} onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} className="rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-sm sm:col-span-2" />
          <textarea required placeholder="Address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} className="min-h-24 rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-sm sm:col-span-2" />
        </div>

        <div className="mt-5 rounded border border-(--border-subtle) bg-(--bg-base) p-4">
          <div className="mb-2 text-xs font-semibold tracking-[0.08em] text-(--text-muted)">STUDENT ID</div>
          <div className="mb-3 text-xs text-(--text-secondary)">
            Student ID File Status:{' '}
            <span className={user?.profile?.idCardFileUploaded ? 'text-(--accent-green)' : 'text-(--accent-red)'}>
              {user?.profile?.idCardFileUploaded ? 'Uploaded' : 'Missing'}
            </span>
          </div>
          <label className="mb-2 block text-xs text-(--text-secondary)">Upload Student ID (JPG/PNG/PDF, max 5MB)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
            className="block w-full text-xs"
          />
          {idCardFile && <div className="mt-2 text-[11px] text-(--accent-cyan)">Selected: {idCardFile.name}</div>}
          <p className="mt-2 text-[11px] text-(--text-muted)">
            All team members must upload Student ID before proposal submission.
          </p>
        </div>

        <button type="submit" disabled={saving} className="mt-5 rounded bg-(--accent-cyan) px-5 py-3 text-sm font-semibold text-black disabled:opacity-60">
          {saving ? 'Saving...' : hasProfile ? 'Save Changes' : 'Complete Profile'}
        </button>
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
