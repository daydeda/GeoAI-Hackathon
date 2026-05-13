'use client'

import { useState } from 'react'
import { Check, Download, FileText, Upload, X, AlertCircle } from 'lucide-react'
import { useAlert } from '@/contexts/AlertContext'
import { useCompetitionPhases } from '@/hooks/useCompetitionPhases'

interface FinalistConfirmationProps {
  teamId: string
  teamName: string
  hasUploaded: boolean
  onSuccess?: () => void
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function FinalistConfirmation({ teamId, hasUploaded, onSuccess }: Omit<FinalistConfirmationProps, 'teamName'>) {
  const { phases } = useCompetitionPhases()
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { showAlert } = useAlert()

  const announcementPhase = phases.find(p => p.key === 'announcement')
  const isAnnouncementStarted = announcementPhase ? new Date() >= new Date(announcementPhase.date) : false

  if (!isAnnouncementStarted) return null

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await fetch(`${API}/api/v1/teams/${teamId}/documents/confirmation`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (res.ok) {
        showAlert('Confirmation document uploaded successfully!', 'info')
        setShowModal(false)
        setSelectedFile(null)
        if (onSuccess) onSuccess()
      } else {
        const d = await res.json()
        showAlert(d.error || 'Failed to upload document', 'error')
      }
    } catch {
      showAlert('Connection error. Please try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const DEADLINE = new Date('2026-05-15T16:00:00+07:00')
  const isExpired = new Date() > DEADLINE

  return (
    <>
      <div className="mb-4 rounded-lg border border-(--accent-green) bg-[rgba(0,230,118,0.05)] p-5 shadow-[0_0_20px_rgba(0,230,118,0.15)] animate-fade-in">
        <div className="font-mono mb-3 text-[12px] tracking-[0.1em] font-bold text-(--accent-green) uppercase">ผ่านเข้ารอบชิงชนะเลิศ (ONSITE)</div>
        <p className="mb-4 text-sm leading-relaxed text-(--text-secondary) font-medium">
          ยินดีด้วย! ทีมของคุณได้ผ่านเข้าสู่รอบชิงชนะเลิศ โปรดทำการยืนยันการเข้าร่วมแข่งขันภายในเวลาที่กำหนด
        </p>
        
        <div className="mb-4 flex items-center gap-2.5 rounded border border-(--accent-red)/30 bg-(--accent-red)/5 p-3">
          <AlertCircle size={18} className="text-(--accent-red) shrink-0" />
          <span className="text-sm sm:text-base font-black tracking-tight text-(--accent-red) uppercase">
            กำหนดการยืนยัน: 15 พ.ค. 2569 เวลา 16:00 น.
          </span>
        </div>

        <button 
          onClick={() => !isExpired && setShowModal(true)}
          disabled={isExpired && !hasUploaded}
          className={`btn w-full justify-center transition-all py-4 ${
            hasUploaded 
              ? 'bg-(--accent-green)/20 text-(--accent-green) border-(--accent-green)/40' 
              : isExpired 
                ? 'bg-(--bg-subtle) text-(--text-muted) cursor-not-allowed opacity-50' 
                : 'bg-(--accent-green) text-black hover:opacity-90 shadow-[0_0_20px_rgba(0,230,118,0.3)]'
          }`}
          style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.02em' }}
        >
          {hasUploaded ? <Check size={20} /> : isExpired ? <X size={20} /> : <FileText size={20} />}
          <span>{hasUploaded ? 'ยืนยันการเข้าร่วมเรียบร้อยแล้ว' : isExpired ? 'หมดเขตการยืนยัน' : 'ยืนยันการเข้าร่วมแข่งขัน'}</span>
        </button>
        
        {hasUploaded ? (
          <div className="mt-3 flex items-center gap-2 text-[12px] text-(--accent-green) font-bold italic">
            <Check size={14} /> อัปโหลดเอกสารแล้ว รอการตรวจสอบจากเจ้าหน้าที่
          </div>
        ) : isExpired && (
          <div className="mt-3 text-[12px] text-(--accent-red) font-bold italic">
            หมดเขตเวลาสำหรับการยืนยันการเข้าร่วมแข่งขันแล้ว
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(5,13,26,0.8)] px-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-xl border border-(--accent-green)/30 bg-(--bg-surface) p-6 sm:p-8 shadow-[0_0_50px_rgba(0,230,118,0.15)] animate-scale-in relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-(--accent-green)/5 blur-3xl" />
            
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-(--text-muted) hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--accent-green)/10 text-(--accent-green)">
                <TrophyIcon size={32} />
              </div>
              <h3 className="font-display mb-3 text-2xl sm:text-3xl text-white tracking-wide">ยืนยันการเข้าร่วมรอบชิงชนะเลิศ</h3>
              <p className="text-sm sm:text-base text-(--text-secondary) leading-relaxed max-w-sm mx-auto">
                เพื่อรักษาสิทธิ์ในการแข่งขันรอบ Onsite โปรดดาวน์โหลด ลงนาม และอัปโหลดเอกสารยืนยันกลับเข้าสู่ระบบ
              </p>
            </div>

            <div className="space-y-4">
              {/* Step 1: Download */}
              <div className="rounded-lg border border-(--border-subtle) bg-(--bg-base) p-4 transition-all hover:border-(--accent-green)/30 group">
                <div className="font-mono mb-2 text-[10px] text-(--text-muted) uppercase tracking-widest">ขั้นตอนที่ 1: ดาวน์โหลดและลงนาม</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-(--accent-green)/10 flex items-center justify-center text-(--accent-green)">
                      <FileText size={16} />
                    </div>
                    <span className="text-sm font-semibold text-white">Confirmation-GEOAI.pdf</span>
                  </div>
                  <a 
                    href="/Confirmation-GEOAI.pdf" 
                    download 
                    className="flex items-center gap-2 rounded bg-(--accent-green) px-3 py-1.5 text-[10px] font-bold text-black hover:opacity-90 transition-all active:scale-95"
                  >
                    <Download size={14} />
                    ดาวน์โหลด
                  </a>
                </div>
              </div>

              {/* Step 2: Upload */}
              <div className="rounded-lg border border-(--border-subtle) bg-(--bg-base) p-4 transition-all hover:border-(--accent-green)/30">
                <div className="font-mono mb-2 text-[10px] text-(--text-muted) uppercase tracking-widest">ขั้นตอนที่ 2: อัปโหลดเอกสารที่ลงนามแล้ว</div>
                
                {!selectedFile ? (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-(--border-subtle) py-6 transition-colors hover:border-(--accent-green)/40 hover:bg-(--accent-green)/5">
                    <Upload size={24} className="mb-2 text-(--text-muted)" />
                    <span className="text-xs font-medium text-(--text-secondary)">คลิกหรือลากไฟล์เพื่ออัปโหลด PDF ที่ลงนามแล้ว</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf" 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between rounded border border-(--accent-green)/30 bg-(--accent-green)/5 p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-8 w-8 rounded bg-(--accent-green)/20 flex items-center justify-center text-(--accent-green) shrink-0">
                        <Check size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-white">{selectedFile.name}</div>
                        <div className="text-[10px] text-(--text-muted)">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 text-(--text-muted) hover:text-(--accent-red) transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button 
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="btn btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all"
                style={{ background: 'var(--accent-green)', color: 'black' }}
              >
                {uploading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <Upload size={18} />
                )}
                <span className="font-bold tracking-wider">อัปโหลดและยืนยันการเข้าร่วม</span>
              </button>
              
              <div className="flex items-start gap-2 px-1 text-[10px] text-(--text-muted) leading-relaxed">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span>การอัปโหลดนี้ถือเป็นการยืนยันว่าทีมของคุณจะเข้าร่วมการแข่งขันรอบ Onsite ตามวัน เวลา และสถานที่ที่กำหนด</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TrophyIcon({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
