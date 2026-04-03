import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'

/**
 * Global error handler for the Fastify application.
 * Normalizes Zod validation errors and other common errors.
 */
export function globalErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // If we have a Zod validation error
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.flatten().fieldErrors,
    })
  }

  // If the error has a status code already, use it
  const statusCode = error.statusCode || 500
  const isProd = process.env.NODE_ENV === 'production'

  // Log error
  request.log.error(error)

  // Send generic error response
  return reply.status(statusCode).send({
    error: error.name || 'Internal Server Error',
    message: isProd ? 'An unexpected error occurred.' : error.message,
    ...(isProd ? {} : { stack: error.stack }),
  })
}
