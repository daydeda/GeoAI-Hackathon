import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.groupBy({
    by: ['university'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 20
  })
  console.log('User University Stats:', JSON.stringify(users, null, 2))

  const teams = await prisma.team.groupBy({
    by: ['institution'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 20
  })
  console.log('Team Institution Stats:', JSON.stringify(teams, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
