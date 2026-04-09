'use client'

import Link from 'next/link'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'

type FaqItem = {
  question: string
  answer: string
}

const CONTACT_EMAIL = 'cegs@kmitl.ac.th'

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'มีกี่คนต่อทีม?',
    answer: 'แต่ละทีมสามารถมีสมาชิกได้ 4 คน โดยต้องมีสมาชิกคนหนึ่งเป็นหัวหน้าทีม',
  },
  {
    question: 'ถ้ายังไม่หมดเวลาส่ง ขอเปลี่ยนไฟล์หรือแก้ Proposal ใหม่ได้หรือเปล่า?',
    answer:
      'ได้ครับ คุณสามารถอัปโหลดไฟล์ที่แก้ไขใหม่ได้เลย โดยระบบจะยึดไฟล์ล่าสุดที่ส่งเข้ามาก่อนปิดรับงานเพื่อนำไปพิจารณาครับ',
  },
  {
    question: 'ไฟล์ที่รองรับสำหรับการส่ง Proposal คือรูปแบบไหน',
    answer: 'ไฟล์ข้อเสนอต้องส่งเป็นรูปแบบ PDF เท่านั้น โดยมีขนาดไฟล์สูงสุดไม่เกิน 20 MB ครับ',
  },
  {
    question: 'บุคคลทั่วไป (Guest) สามารถเข้าดูหน้าช่วยเหลือ (Support) ได้ไหม?',
    answer: 'ได้ครับ หน้าช่วยเหลือเปิดเป็นสาธารณะ สามารถเข้าชมได้โดยไม่จำเป็นต้องเข้าสู่ระบบครับ',
  },
  {
    question: 'หากพบปัญหาทางเทคนิคที่เร่งด่วน ควรแจ้งที่ไหน?',
    answer:
      'กรุณาติดต่อที่อีเมล cegs@kmitl.ac.th โดยรบกวนแนบรูปหน้าจอ (Screenshot) หรือรายละเอียดข้อผิดพลาดมาด้วยครับ เพื่อให้ทีมงานสามารถช่วยแก้ไขปัญหาได้รวดเร็วขึ้นครับ',
  },
]

function SupportContent() {
  return (
    <div className="min-h-screen bg-(--bg-base) px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">

        {/* Header */}
        <section className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-7">
          <p className="text-xs tracking-[0.1em] text-(--text-muted)">PUBLIC SUPPORT CENTER</p>
          <h1 className="mt-2 text-2xl font-semibold text-(--text-primary) sm:text-3xl">
            Contact Us
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--text-secondary)">
            ติดปัญหาเรื่องลงทะเบียน ส่งผลงาน หรือเข้าใช้งานระบบใช่ไหม? ติดต่อเราได้ตามข้อมูลด้านล่าง หรือลองเช็กคำถามที่พบบ่อย (FAQs) ก่อนได้เลย!
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-(--border-active) bg-[rgba(0,229,255,0.08)] px-3 py-1.5 text-xs text-(--accent-cyan)">
            <span className="h-2 w-2 rounded-full bg-(--accent-cyan)" />
            Universal support email: {CONTACT_EMAIL}
          </div>
        </section>

        {/* Contact Cards + Immediate Help */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Contact Us */}
          <article className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-(--text-primary)">
              Contact Us
            </h2>
            <p className="mt-2 text-sm text-(--text-secondary)">
              A single support mailbox is available for all days and all support slots.
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <div className="rounded-lg border border-(--border-subtle) bg-(--bg-base) p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-(--text-muted)">
                  Email
                </p>
                <a
                  className="mt-1 block text-sm text-(--accent-cyan) hover:underline"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>

                <p className="mt-4 text-xs uppercase tracking-[0.08em] text-(--text-muted)">
                  Availability
                </p>
                <p className="mt-1 text-sm text-(--text-secondary)">10:00 - 19:30</p>
              </div>
            </div>
          </article>

          {/* Immediate Help */}
          <article className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-(--text-primary)">Need Immediate Help?</h2>
            <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">
              เพื่อความรวดเร็ว หากมีปัญหาเร่งด่วน รบกวนระบุชื่อทีม เวลา และแนบรูป Screenshot มาให้เราด้วยนะ เราจะได้ช่วยแก้ปัญหาให้คุณได้เร็วขึ้น
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=GeoAI Support Request`}
                className="inline-flex items-center justify-center rounded border border-(--border-active) bg-[rgba(0,229,255,0.12)] px-4 py-2 text-sm font-medium text-(--accent-cyan) hover:bg-[rgba(0,229,255,0.18)]"
              >
                Email Support Team
              </a>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded border border-(--border-subtle) px-4 py-2 text-sm font-medium text-(--text-secondary) hover:text-(--text-primary)"
              >
                Open Competition Docs
              </Link>
            </div>
          </article>
        </section>

        {/* FAQ */}
        <section className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-7">
          <h2 className="text-xl font-semibold text-(--text-primary)">
            คำถามที่พบบ่อย (FAQs)
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {FAQ_ITEMS.map((item) => (
              <article
                key={item.question}
                className="rounded-lg border border-(--border-subtle) bg-(--bg-base) p-4"
              >
                <h3 className="text-sm font-semibold text-(--text-primary)">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

export default function SupportPage() {
  return (
    <AuthProvider>
      <AppShell>
        <SupportContent />
      </AppShell>
    </AuthProvider>
  )
}