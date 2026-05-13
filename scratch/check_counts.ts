import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const allUsers = await prisma.user.count()
  const usersInTeams = await prisma.user.count({
    where: {
      OR: [
        { teamMembers: { some: {} } },
        { ledTeams: { some: {} } }
      ]
    }
  })
  const teamMembersCount = await prisma.teamMember.count()
  const teamsCount = await prisma.team.count()

  console.log({ allUsers, usersInTeams, teamMembersCount, teamsCount })
}

main().catch(console.error).finally(() => prisma.$disconnect())
