import { FastifyInstance } from 'fastify'
import { prisma } from '../plugins/prisma.js'

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get('/stats', async () => {
    const TRACK_LABELS: Record<string, string> = {
      SMART_AGRICULTURE: 'Smart Agriculture',
      DISASTER_FLOOD_RESPONSE: 'Disaster & Flood Response',
    }

    const trackStats = await prisma.team.groupBy({
      by: ['track'],
      where: {
        submissions: { some: { isActive: true } },
      },
      _count: { id: true },
    })

    const [
      totalUsers,
      totalSubmissions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.submission.count({ where: { isActive: true } }),
    ])

    return {
      totalUsers,
      totalSubmissions,
      tracks: trackStats.map(s => ({ 
        name: TRACK_LABELS[s.track] ?? s.track, 
        count: s._count.id 
      })),
    }
  })
}
