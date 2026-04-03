import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default roles
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'COMPETITOR' }, update: {}, create: { name: 'COMPETITOR', description: 'Hackathon participant' } }),
    prisma.role.upsert({ where: { name: 'MODERATOR' }, update: {}, create: { name: 'MODERATOR', description: 'Pre-screening moderator' } }),
    prisma.role.upsert({ where: { name: 'JUDGE' }, update: {}, create: { name: 'JUDGE', description: 'Proposal judge' } }),
    prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN', description: 'Platform administrator' } }),
  ])

  console.log(`✅ Created ${roles.length} roles`)

  // Demo admin user (replace with your Google email after first login)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@geoai.example' },
    update: {},
    create: {
      email: 'admin@geoai.example',
      fullName: 'Admin Alpha',
      oauthProvider: 'google',
      oauthSubject: 'google-seed-admin-001',
      avatarUrl: null,
    },
  })

  const adminRole = roles.find(r => r.name === 'ADMIN')!
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  })

  console.log(`✅ Admin user seeded: ${adminUser.email}`)
  console.log('🎉 Seed complete')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
