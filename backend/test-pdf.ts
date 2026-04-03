import { prisma } from './src/plugins/prisma.js'
import { generatePermissionLetter } from './src/services/pdfGenerator.js'
import { minioClient, BUCKET } from './src/services/storage.js'

async function test() {
  try {
    const team = await prisma.team.findFirst({
      where: { currentStatus: 'FINALIST' },
      include: { members: { include: { user: true } }, leader: true },
    })

    if (!team) {
      console.log('No finalist team found to test generation.')
      process.exit(0)
    }

    console.log(`Generating for team: ${team.name}`)
    const pdfBytes = await generatePermissionLetter({ team })
    console.log(`Generated ${pdfBytes.length} bytes.`)

    const fileKey = `test/permission-letter-${Date.now()}.pdf`
    await minioClient.putObject(BUCKET, fileKey, Buffer.from(pdfBytes), pdfBytes.length, { 'Content-Type': 'application/pdf' })
    console.log(`Uploaded to MinIO: ${fileKey}`)

    const doc = await prisma.document.create({
      data: { teamId: team.id, type: 'PERMISSION_LETTER', fileKey, version: 999 },
    })
    console.log(`Created document record: ${doc.id}`)

    const signed = await minioClient.presignedGetObject(BUCKET, fileKey, 3600)
    console.log(`Signed URL: ${signed}`)

  } catch (err) {
    console.error('Test failed:', err)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

test()
