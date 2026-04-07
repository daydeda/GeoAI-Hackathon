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
    question: 'How many team members are allowed?',
    answer: 'Each team can have 3 to 4 members. One member must be assigned as the team leader.',
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
      'Please contact cegs@kmitl.ac.th and include screenshots or error details.',
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
            Need help with registration, submissions, or platform access? Use the contact
            information below and review the common questions.
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
              For urgent issues, include your team name, issue time, and a screenshot in your email
              so we can triage quickly.
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