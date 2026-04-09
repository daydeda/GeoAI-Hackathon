import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockUserFindUnique,
  mockTeamMemberFindFirst,
  mockTeamMemberFindMany,
} = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockTeamMemberFindFirst: vi.fn(),
  mockTeamMemberFindMany: vi.fn(),
}))

vi.mock('../../plugins/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
    },
    teamMember: {
      findFirst: mockTeamMemberFindFirst,
      findMany: mockTeamMemberFindMany,
    },
    submission: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    team: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('../../middleware/auth.js', () => ({
  authenticate: async (request: { user?: unknown }) => {
    request.user = {
      userId: 'leader-1',
      email: 'leader@example.com',
      roles: ['COMPETITOR'],
      profileCompleted: true,
    }
  },
}))

vi.mock('../../services/phaseConfig.js', () => ({
  getPhaseByKey: vi.fn(async () => ({ date: '2099-01-01T00:00:00.000Z' })),
}))

vi.mock('../../services/storage.js', () => ({
  minioClient: {
    putObject: vi.fn(),
  },
  BUCKET: 'test-bucket',
}))

vi.mock('../../services/auditLog.js', () => ({
  writeAuditLog: vi.fn(),
}))

import { submissionRoutes } from '../submissions.js'

describe('submissionRoutes upload prerequisite blocking', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUserFindUnique.mockResolvedValue({
      id: 'leader-1',
      profileCompleted: true,
      userRoles: [{ role: { name: 'COMPETITOR' } }],
    })

    mockTeamMemberFindFirst.mockResolvedValue({
      teamId: 'team-1',
      team: { leaderId: 'leader-1' },
    })

    mockTeamMemberFindMany.mockResolvedValue([
      {
        user: {
          id: 'leader-1',
          fullName: 'Alice Leader',
          email: 'alice@example.com',
          experience: '',
          idCardFileKey: null,
          idCardFileName: null,
        },
      },
      {
        user: {
          id: 'member-2',
          fullName: 'Bob Member',
          email: 'bob@example.com',
          experience: 'Worked on remote sensing projects',
          idCardFileKey: '',
          idCardFileName: '',
        },
      },
    ])
  })

  it('returns 409 with member-level missing prerequisites (experience and/or studentId)', async () => {
    const app = Fastify()
    await submissionRoutes(app)

    const response = await app.inject({
      method: 'POST',
      url: '/submissions/upload',
    })

    expect(response.statusCode).toBe(409)

    const payload = response.json() as {
      error: string
      missingMembers: Array<{
        userId: string
        fullName: string
        email: string
        missing: Array<'experience' | 'studentId'>
      }>
    }

    expect(payload.error).toContain('Experience and upload Student ID')
    expect(payload.missingMembers).toHaveLength(2)
    expect(payload.missingMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'leader-1',
          fullName: 'Alice Leader',
          missing: ['experience', 'studentId'],
        }),
        expect.objectContaining({
          userId: 'member-2',
          fullName: 'Bob Member',
          missing: ['studentId'],
        }),
      ])
    )

    await app.close()
  })
})
