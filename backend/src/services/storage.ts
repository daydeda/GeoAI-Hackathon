import { Client } from 'minio'

export const BUCKET = process.env.MINIO_BUCKET || 'geoai-files'

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
})

export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET)
  if (!exists) {
    await minioClient.makeBucket(BUCKET, 'us-east-1')
    console.log(`[MinIO] Created bucket: ${BUCKET}`)
  }
}

/**
 * Converts internal Docker URLs (e.g. storage:9000) to external URLs (localhost:9000)
 * so the user's browser can actually reach the file.
 */
export function getPublicUrl(internalUrl: string): string {
  const internalHost = process.env.MINIO_ENDPOINT || 'storage'
  const publicHost = 'localhost' // In dev, we always want localhost for the browser
  
  if (internalUrl.includes(internalHost)) {
    return internalUrl.replace(internalHost, publicHost)
  }
  return internalUrl
}
