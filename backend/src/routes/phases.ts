import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireRole, JwtPayload } from '../middleware/auth.js'
import { getPhaseConfig, updatePhaseDates } from '../services/phaseConfig.js'
import { writeAuditLog } from '../services/auditLog.js'

const UpdatePhasesSchema = z.object({
  phases: z.array(
    z.object({
      key: z.string().min(1),
      date: z.string().min(1),
    }),
  ).min(1),
})

export async function phaseRoutes(app: FastifyInstance) {
  app.get('/phases', async () => {
    const phases = await getPhaseConfig()
    return { data: phases }
  })

  app.put('/admin/phases', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    try {
      const actor = request.user as JwtPayload
      const parsed = UpdatePhasesSchema.safeParse(request.body)
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

      const invalid = parsed.data.phases.find((item) => Number.isNaN(new Date(item.date).getTime()))
      if (invalid) {
        return reply.status(400).send({
          error: `Invalid date format for phase key: ${invalid.key}`,
          message: 'Use a valid date and time before saving deadlines.',
        })
      }

      const mapping = parsed.data.phases.reduce<Record<string, string>>((acc, item) => {
        acc[item.key] = item.date
        return acc
      }, {})

      const updated = await updatePhaseDates(mapping)

      await writeAuditLog({
        actorId: actor.userId,
        action: 'PHASE_DEADLINES_UPDATED',
        entityType: 'phase',
        entityId: 'global',
        newValue: updated,
      })

      return { message: 'Phase deadlines updated', data: updated }
    } catch (error) {
      request.log.error({ error }, 'Failed to update phase deadlines')
      return reply.status(500).send({
        error: 'Failed to update phase deadlines',
        message: error instanceof Error ? error.message : 'Unexpected server error while updating phase deadlines.',
      })
    }
  })
}
