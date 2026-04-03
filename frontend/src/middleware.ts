import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add paths that require authentication here
const protectedPaths = ['/admin', '/mod', '/judge', '/team', '/submissions', '/resources']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('geoai_token')
  const { pathname } = request.nextUrl
  
  // Check if the current path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedPath) {
    if (!token) {
      // Not logged in -> redirect to login (or home)
      return NextResponse.redirect(new URL('/', request.url))
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
        if (pathname.startsWith('/admin') && !roles.includes('ADMIN')) {
          return NextResponse.redirect(new URL('/team', request.url))
        }
        if (pathname.startsWith('/judge') && !roles.includes('JUDGE')) {
          return NextResponse.redirect(new URL('/team', request.url))
        }
        if (pathname.startsWith('/mod') && !roles.includes('MODERATOR')) {
          return NextResponse.redirect(new URL('/team', request.url))
        }
      }
    } catch (err) {
      // In case of any decoding errors, let it pass through to the frontend
      // The backend API will still block unauthorized requests securely
      console.error('Middleware JWT decode error:', err)
    }
  }

  // Handle users who are already logged in trying to access the login page
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/team', request.url))
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
