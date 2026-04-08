import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppShell from '../AppShell'

const mockUsePathname = vi.fn()
const mockUseAuth = vi.fn()
const mockUseCompetitionPhases = vi.fn()

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/hooks/useCompetitionPhases', () => ({
  useCompetitionPhases: () => mockUseCompetitionPhases(),
}))

describe('AppShell profile setup modal responsiveness', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard')
    mockUseCompetitionPhases.mockReturnValue({
      currentPhase: {
        title: 'Proposal Submission',
        date: null,
      },
    })

    mockUseAuth.mockReturnValue({
      loading: false,
      logout: vi.fn(),
      refetch: vi.fn(),
      user: {
        fullName: 'Test Competitor',
        roles: ['COMPETITOR'],
        profileCompleted: false,
        profile: {
          firstName: 'Phasin',
          lastName: 'Techaerawan',
          university: 'KMITL',
          yearOfStudy: 3,
          phoneNumber: '0839463342',
          address: '1 ChalongKrung Road, Kmitl',
        },
      },
    })
  })

  it('keeps the profile setup modal scrollable with a sticky submit action', () => {
    render(
      <AppShell>
        <div>Page</div>
      </AppShell>
    )

    const overlay = screen.getByTestId('profile-setup-overlay')
    const form = screen.getByTestId('profile-setup-form')
    const saveButton = screen.getByRole('button', { name: /save and continue/i })

    expect(overlay).toHaveClass('overflow-y-auto')
    expect(form).toHaveClass('max-h-[calc(100dvh-1.5rem)]')
    expect(form).toHaveClass('overflow-y-auto')

    const stickyAction = saveButton.parentElement
    expect(stickyAction).not.toBeNull()
    expect(stickyAction).toHaveClass('sticky')
    expect(stickyAction).toHaveClass('bottom-0')
  })

  it('keeps submit button available after validation API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: 'address: String must contain at least 8 character(s)' }),
    }))

    render(
      <AppShell>
        <div>Page</div>
      </AppShell>
    )

    const saveButton = screen.getByRole('button', { name: /save and continue/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/address: String must contain at least 8 character\(s\)/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /save and continue/i })).toBeVisible()
  })
})
