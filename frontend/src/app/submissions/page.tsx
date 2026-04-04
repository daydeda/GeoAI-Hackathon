'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { useDropzone } from 'react-dropzone'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const ANNOUNCEMENT_DATE = '2026-05-08T00:00:00+07:00'

interface Submission { id: string; version: number; gistdaDeclared: boolean; submittedAt: string; moderatorReview?: { status: string; note?: string } }

function normalizeReviewStatus(status?: string) {
  if (status === 'PASS') return 'PASS'
  if (status === 'FAIL' || status === 'DISQUALIFIED') return 'DISQUALIFIED'
  return 'UNDER REVIEW'
}

function SubmissionsContent() {
  const { user, loading: authLoading } = useAuth()
  const [history, setHistory] = useState<Submission[]>([])
  const [hasTeam, setHasTeam] = useState(true)
  const [loading, setLoading] = useState(true)
  
  const [file, setFile] = useState<File | null>(null)
  const [gistda, setGistda] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const fetchHistory = useCallback(async () => {
    if (authLoading) return
    try {
      if (!user?.team) { 
        setHasTeam(false)
        setLoading(false)
        return 
      }
      setHasTeam(true)
      const res = await fetch(`${API}/api/v1/submissions`, { credentials: 'include' })
      if (res.ok) { const d = await res.json(); setHistory(d.data ?? []) }
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('')
    if (acceptedFiles.length > 0) {
      if (acceptedFiles[0].size > 20 * 1024 * 1024) setError('File exceeds 20MB limit')
      else setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1
  })

  const upload = async () => {
    if (!file || !gistda || uploading) return
    setUploading(true); setError('')
    const formData = new FormData()
    formData.append('document', file)
    formData.append('gistdaDeclared', 'true')

    try {
      const res = await fetch(`${API}/api/v1/submissions/upload`, {
        method: 'POST', credentials: 'include', body: formData
      })
      if (res.ok) { setFile(null); setGistda(false); fetchHistory() }
      else { const d = await res.json(); setError(d.message || 'Upload failed') }
    } catch {
      setError('Network error during upload')
    } finally {
      setUploading(false)
    }
  }

  const download = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    const res = await fetch(`${API}/api/v1/submissions/${id}/download`, { credentials: 'include' })
    if (res.ok) {
      const d = await res.json()
      window.open(d.url, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading || authLoading) return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="font-mono text-sm text-(--accent-cyan)">Synching…</div>
    </div>
  )

  if (!hasTeam) return (
    <div className="min-h-screen px-4 py-12 sm:py-16 lg:py-20 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl mb-4 sm:mb-6">No Team Found</h1>
        <p className="text-sm sm:text-base text-(--text-secondary) mb-6 sm:mb-8">
          You must create or join a team before submitting.
        </p>
        <a href="/team" className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 bg-(--accent-cyan) text-(--bg-base) rounded font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity no-underline">
          GO TO TEAM TERMINAL
        </a>
      </div>
    </div>
  )

  const activeSubmission = history[0]
  const canShowAnnouncement = Date.now() >= new Date(ANNOUNCEMENT_DATE).getTime()
  const reviewStatus = canShowAnnouncement
    ? normalizeReviewStatus(activeSubmission?.moderatorReview?.status)
    : 'UNDER REVIEW'

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-4 tracking-widest">
          SUBMISSION TERMINAL
        </h1>
        <p className="text-xs sm:text-sm text-(--text-secondary) mb-6 sm:mb-8">
          Upload your technical proposal. Subsequent uploads will version your submission.
        </p>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-md bg-[rgba(255,23,68,0.1)] border border-(--accent-red) text-(--accent-red) text-xs sm:text-sm flex items-start gap-2 sm:gap-3">
            <span className="text-base flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 sm:gap-6">
          {/* Upload Form */}
          <div className="card p-4 sm:p-6 rounded-lg border border-(--border-subtle) bg-(--bg-surface)">
            <div className="font-mono text-[10px] sm:text-xs text-(--accent-cyan) mb-4 tracking-widest">NEW UPLINK</div>
            
            <div
              {...getRootProps()}
              className={`p-6 sm:p-8 rounded-lg border-2 border-dashed mb-4 sm:mb-6 cursor-pointer transition-colors text-center ${
                isDragActive
                  ? 'border-(--accent-cyan) bg-[rgba(0,229,255,0.05)]'
                  : 'border-(--border-subtle) bg-(--bg-base) hover:border-(--border-active)'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{file ? '📄' : '⬆️'}</div>
              <div className="font-semibold text-xs sm:text-sm mb-1 text-(--text-primary)">
                {file ? file.name : (isDragActive ? 'Drop file here' : 'Drag & drop PDF here')}
              </div>
              <div className="text-[10px] sm:text-xs text-(--text-muted)">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Max 20MB. PDF format only.'}
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 items-start p-3 sm:p-4 bg-(--bg-base) rounded-lg border border-(--border-subtle) mb-4 sm:mb-6">
              <input
                type="checkbox"
                id="gistda"
                checked={gistda}
                onChange={e => setGistda(e.target.checked)}
                className="mt-1 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="gistda" className="text-xs sm:text-sm text-(--text-secondary) leading-relaxed cursor-pointer">
                I declare that this project utilizes{' '}
                <strong className="text-(--accent-amber)">Sphere of GISTDA</strong> and adheres to the
                multispectral processing guidelines established in the hackathon brief.
              </label>
            </div>

            <button
              onClick={upload}
              disabled={!file || !gistda || uploading}
              className="w-full px-4 py-2.5 sm:py-3 bg-(--accent-cyan) text-(--bg-base) rounded font-semibold text-xs sm:text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {uploading ? 'UPLOADING...' : 'INITIATE TRANSMISSION'}
            </button>
          </div>

          {/* History */}
          <div className="card p-4 sm:p-6 rounded-lg border border-(--border-subtle) bg-(--bg-surface)">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div className="font-mono text-[10px] sm:text-xs text-(--text-muted) tracking-widest">VERSION HISTORY</div>
              <span className="badge text-[10px] px-2 py-1 bg-(--bg-base) text-(--accent-cyan) rounded">
                {history.length} RECORDS
              </span>
            </div>

            {activeSubmission && (
              <div className="p-3 sm:p-4 bg-(--bg-elevated) rounded-lg border border-(--accent-cyan) mb-4 sm:mb-6">
                <div className="text-[10px] sm:text-xs text-(--accent-cyan) font-bold mb-2 uppercase tracking-widest">
                  ACTIVE PROPOSAL (v{activeSubmission.version})
                </div>
                <div className="text-xs sm:text-sm text-(--text-primary) mb-3 sm:mb-4">
                  Status:{' '}
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        reviewStatus === 'PASS'
                          ? 'var(--accent-green)'
                          : reviewStatus === 'DISQUALIFIED'
                            ? 'var(--accent-red)'
                            : 'var(--text-secondary)',
                    }}
                  >
                    {reviewStatus}
                  </span>
                </div>
                <button
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-(--border-active) rounded hover:bg-(--bg-base) transition-colors"
                  onClick={e => download(activeSubmission.id, e)}
                >
                  VIEW DOCUMENT
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:gap-3">
              {history.slice(1).map(h => (
                <div
                  key={h.id}
                  className="p-3 sm:p-4 bg-(--bg-base) border border-(--border-subtle) rounded-lg flex justify-between items-center hover:border-(--border-active) transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-semibold">Version {h.version}</div>
                    <div className="font-mono text-[10px] text-(--text-muted) truncate">
                      {new Date(h.submittedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    className="ml-2 px-2 sm:px-3 py-1 text-xs text-(--text-muted) hover:text-(--accent-cyan) transition-colors flex-shrink-0"
                    onClick={e => download(h.id, e)}
                  >
                    DL
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubmissionsPage() {
  return (
    <AuthProvider>
      <AppShell>
        <SubmissionsContent />
      </AppShell>
    </AuthProvider>
  )
}
