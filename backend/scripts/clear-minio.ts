import { minioClient, BUCKET } from '../src/services/storage.js'

function listAllObjects(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const names: string[] = []
    // `listObjects` returns an EventEmitter-style stream
    const stream = (minioClient as any).listObjects(BUCKET, '', true)
    stream.on('data', (obj: any) => {
      if (obj && obj.name) names.push(obj.name)
    })
    stream.on('error', (err: any) => reject(err))
    stream.on('end', () => resolve(names))
  })
}

async function main() {
  try {
    console.log(`[MinIO] Listing objects in bucket: ${BUCKET}`)
    const names = await listAllObjects()
    if (!names || names.length === 0) {
      console.log('[MinIO] No objects to delete.')
      return
    }

    console.log(`[MinIO] Found ${names.length} objects — deleting...`)
    for (const name of names) {
      try {
        // removeObject deletes a single object
        // note: removeObjects exists but this loop is simple and reliable
        // eslint-disable-next-line no-await-in-loop
        await (minioClient as any).removeObject(BUCKET, name)
        console.log('[MinIO] Deleted:', name)
      } catch (err) {
        console.error('[MinIO] Failed to delete:', name, err)
      }
    }

    console.log(`[MinIO] Deletion complete. Deleted ${names.length} objects.`)
  } catch (err) {
    console.error('[MinIO] Error during clear operation:', err)
    process.exit(1)
  }
}

main()
