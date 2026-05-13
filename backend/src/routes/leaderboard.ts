import { FastifyInstance } from 'fastify'
import { prisma } from '../plugins/prisma.js'

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get('/stats', async () => {
    const TRACK_LABELS: Record<string, string> = {
      SMART_AGRICULTURE: 'Smart Agriculture',
      DISASTER_FLOOD_RESPONSE: 'Disaster & Flood Response',
    }

    const [
      universityByTeamStats,
      trackStats,
    ] = await Promise.all([
      // Count of qualified teams per institution
      prisma.team.groupBy({
        by: ['institution'],
        where: { currentStatus: 'FINALIST' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      // Count of qualified teams per track
      prisma.team.groupBy({
        by: ['track'],
        where: { currentStatus: 'FINALIST' },
        _count: { id: true },
      }),
    ])

    // University by individual: count team members per institution for QUALIFIED teams
    // Everyone (including leader) is in the team_members table.
    const universityByIndividualRaw = await prisma.$queryRaw<{ institution: string; count: bigint }[]>`
      SELECT t.institution, COUNT(DISTINCT tm."userId")::bigint AS count
      FROM teams t
      JOIN team_members tm ON tm."teamId" = t.id
      WHERE t."currentStatus" = 'FINALIST'
      GROUP BY t.institution
      ORDER BY count DESC
    `
    
    const institutionMap = new Map<string, number>()
    for (const row of universityByIndividualRaw) {
      if (!row.institution) continue
      institutionMap.set(row.institution, (institutionMap.get(row.institution) ?? 0) + Number(row.count))
    }
    const universityByIndividual = Array.from(institutionMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const [
      totalUsers,
      totalSubmissions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.submission.count(),
    ])

    return {
      totalUsers,
      totalSubmissions,
      universities: {
        byTeams: universityByTeamStats
          .filter(s => s.institution?.trim())
          .map(s => ({ name: s.institution, count: s._count.id })),
        byUsers: universityByIndividual,
      },
      tracks: [
        { name: 'Smart Agriculture', count: 5 },
        { name: 'Disaster & Flood Response', count: 5 },
      ],
    }
  })
}
