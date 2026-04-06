import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add paths that require authentication here
const protectedPaths = ['/admin', '/moderator', '/mod', '/judge', '/team', '/submissions', '/resources', '/dashboard', '/documents', '/invite']

function withBasePath(basePath: string, path: string) {
  if (!basePath) return path
  return `${basePath}${path}`
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('geoai_token')
  const { pathname, basePath } = request.nextUrl
  const host = request.headers.get('host')?.split(':')[0] || ''

  if (host === 'cegs.kmitl.ac.th' && pathname === '/') {
    return NextResponse.redirect(new URL('https://iono-gnss.kmitl.ac.th'))
  }

  const normalizedPath = basePath && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || '/'
    : pathname
  
  // Check if the current path requires authentication
  const isProtectedPath = protectedPaths.some(path => normalizedPath.startsWith(path))

  if (isProtectedPath) {
    if (!token) {
      // Not logged in -> redirect to login
      return NextResponse.redirect(new URL(withBasePath(basePath, '/login'), request.url))
    }

    // Optional: We can decode the JWT to do basic Role-Based routing here
    try {
      // Extract the payload part of the JWT
      const base64Url = token.value.split('.')[1]
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        // Decode base64 to JSON
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        const payload = JSON.parse(jsonPayload)
        
        const roles: string[] = payload.roles || []

        // Basic RBAC routing based on decoded roles
        if (normalizedPath.startsWith('/admin') && !(roles.includes('ADMIN') || roles.includes('MODERATOR'))) {
          return NextResponse.redirect(new URL(withBasePath(basePath, '/team'), request.url))
        }
        if (normalizedPath.startsWith('/judge') && !(roles.includes('JUDGE') || roles.includes('ADMIN') || roles.includes('MODERATOR'))) {
          return NextResponse.redirect(new URL(withBasePath(basePath, '/team'), request.url))
        }
        if ((normalizedPath.startsWith('/mod') || normalizedPath.startsWith('/moderator')) && !(roles.includes('MODERATOR') || roles.includes('ADMIN'))) {
          return NextResponse.redirect(new URL(withBasePath(basePath, '/team'), request.url))
        }
      }
    } catch (err) {
      // In case of any decoding errors, let it pass through to the frontend
      // The backend API will still block unauthorized requests securely
      console.error('Middleware JWT decode error:', err)
    }
  }

  return NextResponse.next()
}

// Ensure the middleware is only run on relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
