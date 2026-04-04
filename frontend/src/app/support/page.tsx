'use client'

import Link from 'next/link'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'

type ContactPerson = {
  fullName: string
  nickname: string
  email: string
  workingHours: string
}

type FaqItem = {
  question: string
  answer: string
}

// Map วันในสัปดาห์ (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
// ไปหา array ของ ContactPerson — เพิ่มหลายคนในวันเดียวกันได้เลย
const CONTACT_BY_DAY: Record<number, ContactPerson[]> = {
  1: [
    {
        fullName: 'Nattapong Srisawat',
        nickname: 'Nattapong',
        email: 'nattapong.support@geoaihack.local',
        workingHours: '09:00 - 17:00',
    },
    {
      fullName: 'Puri Sangnawakit',
      nickname: 'Guy',
      email: 'puri_s@cmu.ac.th',
      workingHours: '10:00 - 18:00',
    },
  ],
  2: [
    {
      fullName: 'Kamonchanok Preecha',
      nickname: 'Kamonchanok',
      email: 'kamonchanok.support@geoaihack.local',
      workingHours: '10:00 - 18:00',
    },
    {
      fullName: 'Puri Sangnawakit',
        nickname: 'Guy',
      email: 'puri_s@cmu.ac.th',
      workingHours: '10:00 - 18:00',
    },
  ],
  3: [
    {
        fullName: 'Thanawat Charoen',
        nickname: 'Thanawat',
        email: 'thanawat.support@geoaihack.local',
        workingHours: '08:30 - 16:30',
    },
    {
        fullName: 'Puri Sangnawakit',
        nickname: 'Guy',
        email: 'puri_s@cmu.ac.th',
        workingHours: '10:00 - 18:00',
    },
  ],
  4: [
    {
        fullName: 'Patcharin Intarakul',
        nickname: 'Patcharin',
        email: 'patcharin.support@geoaihack.local',
        workingHours: '11:00 - 19:00',
    },
    {
      fullName: 'Puri Sangnawakit',
      nickname: 'Guy',
      email: 'puri_s@cmu.ac.th',
      workingHours: '10:00 - 18:00',
    },
  ],
  5: [
    {
      fullName: 'Sorawit Kittipong',
      nickname: 'Sorawit',
      email: 'sorawit.support@geoaihack.local',
      workingHours: '09:30 - 17:30',
    },
    {
      fullName: 'Puri Sangnawakit',
      nickname: 'Guy',
      email: 'puri_s@cmu.ac.th',
      workingHours: '10:00 - 18:00',
    },
  ],
  6: [
    {
      fullName: 'Warisara Somboon',
      nickname: 'Warisara',
      email: 'warisara.support@geoaihack.local',
      workingHours: '10:00 - 16:00',
    },
    {
      fullName: 'Krit Phommarath',
      nickname: 'Krit',
      email: 'krit.support@geoaihack.local',
      workingHours: '10:00 - 16:00',
    },
  ],
  0: [
    {
      fullName: 'Puri Sangnawakit',
      nickname: 'Guy',
      email: 'puri_s@cmu.ac.th',
      workingHours: '10:00 - 18:00',
    },
    {
      fullName: 'Krit Phommarath',
      nickname: 'Krit',
      email: 'krit.support@geoaihack.local',
      workingHours: '10:00 - 16:00',
    },
  ],
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How many team members are allowed?',
    answer: 'Each team can have 3 to 5 members. One member must be assigned as the team leader.',
  },
  {
    question: 'Can we update our submission before the deadline?',
    answer:
      'Yes. You can upload a revised file, and the latest upload before the deadline will be used for evaluation.',
  },
  {
    question: 'What file format is accepted for proposal upload?',
    answer: 'Proposal files must be submitted in PDF format with a maximum size of 20 MB.',
  },
  {
    question: 'Can guest users open the support page?',
    answer: 'Yes. The support page is public and can be viewed without signing in.',
  },
  {
    question: 'Where should we report urgent technical issues?',
    answer:
      'Please contact the assigned support person of the day by email and include screenshots or error details.',
  },
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getContactsForDay(day: number): ContactPerson[] {
  return CONTACT_BY_DAY[day] ?? []
}

export function SupportContent() {
  const today = new Date()
  const todayLabel = DAY_NAMES[today.getDay()]
  const contacts = getContactsForDay(today.getDay())

  return (
    <div className="min-h-screen bg-(--bg-base) px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">

        {/* Header */}
        <section className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-7">
          <p className="text-xs tracking-[0.1em] text-(--text-muted)">PUBLIC SUPPORT CENTER</p>
          <h1 className="mt-2 text-2xl font-semibold text-(--text-primary) sm:text-3xl">
            Support & FAQ
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--text-secondary)">
            Need help with registration, submissions, or platform access? Use the contact
            information below and review the common questions.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-(--border-active) bg-[rgba(0,229,255,0.08)] px-3 py-1.5 text-xs text-(--accent-cyan)">
            <span className="h-2 w-2 rounded-full bg-(--accent-cyan)" />
            Active contact{contacts.length > 1 ? 's' : ''} for {todayLabel}
          </div>
        </section>

        {/* Contact Cards + Immediate Help */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Contact Person Of The Day */}
          <article className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-(--text-primary)">
              Contact Person{contacts.length > 1 ? 's' : ''} Of The Day
            </h2>
            <p className="mt-2 text-sm text-(--text-secondary)">
              {contacts.length > 1
                ? 'Multiple contacts are available today. Reach out to either person below.'
                : 'Contact rotates by weekday. Monday shows the first person, Tuesday the second, and continues in order.'}
            </p>

            <div className="mt-5 flex flex-col gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.email}
                  className="rounded-lg border border-(--border-subtle) bg-(--bg-base) p-4"
                >
                  <p className="text-xs uppercase tracking-[0.08em] text-(--text-muted)">
                    Full Name
                  </p>
                  <p className="mt-1 text-base font-semibold text-(--text-primary)">
                    {contact.fullName}
                  </p>

                  <p className="mt-4 text-xs uppercase tracking-[0.08em] text-(--text-muted)">
                    Email
                  </p>
                  <a
                    className="mt-1 block text-sm text-(--accent-cyan) hover:underline"
                    href={`mailto:${contact.email}`}
                  >
                    {contact.email}
                  </a>

                  <p className="mt-4 text-xs uppercase tracking-[0.08em] text-(--text-muted)">
                    Working Hours
                  </p>
                  <p className="mt-1 text-sm text-(--text-secondary)">{contact.workingHours}</p>
                </div>
              ))}
            </div>
          </article>

          {/* Immediate Help */}
          <article className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-(--text-primary)">Need Immediate Help?</h2>
            <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">
              For urgent issues, include your team name, issue time, and a screenshot in your email
              so we can triage quickly.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              {contacts.map((contact) => (
                <a
                  key={contact.email}
                  href={`mailto:${contact.email}?subject=GeoAI Support Request`}
                  className="inline-flex items-center justify-center rounded border border-(--border-active) bg-[rgba(0,229,255,0.12)] px-4 py-2 text-sm font-medium text-(--accent-cyan) hover:bg-[rgba(0,229,255,0.18)]"
                >
                  Email {contact.fullName.split(' ')[0]}
                </a>
              ))}
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
            Frequently Asked Questions
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