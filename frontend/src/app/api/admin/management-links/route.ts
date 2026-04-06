import { NextRequest, NextResponse } from 'next/server'

interface ManagementLinksResponse {
  prismaStudio: string
  minioConsole: string
}

function isSupportedProtocol(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function isLocalAddress(value: string) {
  try {
    const { hostname } = new URL(value)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const databaseManagementUrl = process.env.DATABASE_MANAGEMENT_URL?.trim()
  const storageManagementUrl = process.env.STORAGE_MANAGEMENT_URL?.trim()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

  if (!databaseManagementUrl || !storageManagementUrl || !apiBaseUrl) {
    return NextResponse.json({ error: 'Management URLs are not configured' }, { status: 500 })
  }

  if (!isSupportedProtocol(databaseManagementUrl) || !isSupportedProtocol(storageManagementUrl)) {
    return NextResponse.json({ error: 'Management URLs must use http or https' }, { status: 500 })
  }

  if (process.env.NODE_ENV === 'production' && (isLocalAddress(databaseManagementUrl) || isLocalAddress(storageManagementUrl))) {
    return NextResponse.json({ error: 'Localhost management URLs are not allowed in production' }, { status: 500 })
  }

  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const toolsAccessRes = await fetch(`${apiBaseUrl}/api/v1/admin/tools-access`, {
    method: 'GET',
    headers: {
      cookie: cookieHeader,
    },
    cache: 'no-store',
  })

  if (!toolsAccessRes.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload: ManagementLinksResponse = {
    prismaStudio: databaseManagementUrl,
    minioConsole: storageManagementUrl,
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
