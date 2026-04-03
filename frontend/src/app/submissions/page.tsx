'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { useDropzone } from 'react-dropzone'

const API = process.env.NEXT_PUBLIC_API_URL || '/geoai-2026'

interface Submission { id: string; version: number; gistdaDeclared: boolean; submittedAt: string; moderatorReview?: { status: string; note?: string } }

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

  if (loading || authLoading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Synching…</div>

  if (!hasTeam) return (
    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
      <h1 className="font-display" style={{ fontSize: 32, marginBottom: 16 }}>No Team Found</h1>
      <p style={{ color: 'var(--text-secondary)' }}>You must create or join a team before submitting.</p>
      <a href="/team" className="btn btn-primary" style={{ marginTop: 24, textDecoration: 'none' }}>GO TO TEAM TERMINAL</a>
    </div>
  )

  const activeSubmission = history[0]

  return (
    <div style={{ padding: 32, maxWidth: 1000 }}>
      <h1 className="font-display" style={{ fontSize: 36, marginBottom: 8 }}>Submission Terminal</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Upload your technical proposal. Subsequent uploads will version your submission.</p>

      {error && (
        <div style={{ padding: 12, border: '1px solid var(--accent-red)', background: 'rgba(255, 23, 68, 0.1)', color: 'var(--accent-red)', borderRadius: 6, marginBottom: 24, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 24 }}>
        {/* Upload Form */}
        <div className="card" style={{ padding: 24 }}>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--accent-cyan)', marginBottom: 16 }}>NEW UPLINK</div>
          
          <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'drag-active' : ''}`} style={{ marginBottom: 20 }}>
            <input {...getInputProps()} />
            <div style={{ fontSize: 32, marginBottom: 12 }}>{file ? '📄' : '⬆'}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {file ? file.name : (isDragActive ? 'Drop file here' : 'Drag & drop PDF here')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Max 20MB. PDF format only.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16, background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
            <input type="checkbox" id="gistda" checked={gistda} onChange={e => setGistda(e.target.checked)} style={{ marginTop: 4, cursor: 'pointer' }} />
            <label htmlFor="gistda" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, cursor: 'pointer' }}>
              I declare that this project utilizes <strong style={{ color: 'var(--accent-amber)' }}>Sphere of GISTDA</strong> and adheres to the multispectral processing guidelines established in the hackathon brief.
            </label>
          </div>

          <button onClick={upload} disabled={!file || !gistda || uploading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {uploading ? 'UPLOADING...' : 'INITIATE TRANSMISSION'}
          </button>
        </div>

        {/* History */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>VERSION HISTORY</div>
            <span className="badge badge-draft">{history.length} RECORDS</span>
          </div>

          {activeSubmission && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--accent-cyan)', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 4 }}>ACTIVE PROPOSAL (v{activeSubmission.version})</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>
                Status: <span style={{ fontWeight: 600, color: activeSubmission.moderatorReview?.status === 'PASS' ? 'var(--accent-green)' : activeSubmission.moderatorReview?.status === 'FAIL' ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                  {activeSubmission.moderatorReview?.status || 'UNDER REVIEW'}
                </span>
              </div>
              <button className="btn btn-outline" style={{ fontSize: 11, padding: '6px 12px', width: '100%', justifyContent: 'center' }} onClick={(e) => download(activeSubmission.id, e)}>
                VIEW DOCUMENT
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.slice(1).map(h => (
              <div key={h.id} style={{ padding: 12, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Version {h.version}</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(h.submittedAt).toLocaleString()}</div>
                </div>
                <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={(e) => download(h.id, e)}>DL</button>
              </div>
            ))}
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
