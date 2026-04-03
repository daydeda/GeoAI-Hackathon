import { Client } from 'minio'

export const BUCKET = process.env.MINIO_BUCKET || 'geoai-files'

/**
 * Internal client for server-to-server operations (upload/delete/stream).
 * Uses 'storage' or internal endpoint for network access within Docker.
 */
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  region: 'us-east-1',
})

export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET)
  if (!exists) {
    await minioClient.makeBucket(BUCKET, 'us-east-1')
    console.log(`[MinIO] Created bucket: ${BUCKET}`)
  }
}
