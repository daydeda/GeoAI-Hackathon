import '@fastify/jwt'
import { JwtPayload } from '../middleware/auth.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: JwtPayload
  }
}
