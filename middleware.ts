import { NextRequest, NextResponse } from 'next/server'
import { TokenManager, ROUTE_PERMISSIONS, RouteGuard } from '@/lib/auth'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/help',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/workers/register',
  '/_next',
  '/favicon.ico'
]

// Routes that require specific authentication but no role check
const AUTH_ONLY_ROUTES = [
  '/api/auth/verify'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.includes('_next') ||
    pathname.includes('favicon') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next()
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Get token from header or cookie
  let token: string | null = null
  
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    // Fallback to cookie for browser requests
    token = request.cookies.get('auth_token')?.value || null
  }

  // Check if token exists
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    } else {
      // Redirect to login page for web routes
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Verify token
  const payload = TokenManager.verifyToken(token)
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    } else {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // For auth-only routes, just check if authenticated
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  if (isAuthOnlyRoute) {
    // Add user info to headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId)
    response.headers.set('x-user-role', payload.role)
    response.headers.set('x-user-email', payload.email)
    return response
  }

  // Check role-based permissions
  const requiredPermissions = getRoutePermissions(pathname)
  
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission =>
      payload.permissions.includes(permission)
    )

    if (!hasPermission) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      } else {
        // Redirect to appropriate dashboard based on role
        const dashboardUrl = getDashboardUrl(payload.role)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    }
  }

  // Add user info to headers for API routes
  const response = NextResponse.next()
  response.headers.set('x-user-id', payload.userId)
  response.headers.set('x-user-role', payload.role)
  response.headers.set('x-user-email', payload.email)
  
  return response
}

/**
 * Get required permissions for a route
 */
function getRoutePermissions(pathname: string): string[] {
  // Check exact matches first
  if (ROUTE_PERMISSIONS[pathname as keyof typeof ROUTE_PERMISSIONS]) {
    return [...ROUTE_PERMISSIONS[pathname as keyof typeof ROUTE_PERMISSIONS]]
  }

  // Check pattern matches
  for (const [routePattern, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(routePattern)) {
      return [...permissions]
    }
  }

  // API route patterns
  if (pathname.startsWith('/api/workers/')) {
    if (pathname.includes('/documents')) {
      return ['read:own_documents', 'read:patient_documents']
    }
    return ['read:own_profile', 'read:patient_profiles']
  }

  if (pathname.startsWith('/api/doctors/')) {
    return ['read:patient_profiles']
  }

  if (pathname.startsWith('/api/admin/')) {
    return ['read:all_users']
  }

  // Default: require authentication but no specific permissions
  return []
}

/**
 * Get appropriate dashboard URL based on user role
 */
function getDashboardUrl(role: string): string {
  switch (role) {
    case 'worker':
      return '/workers/dashboard'
    case 'doctor':
      return '/doctors'
    case 'admin':
      return '/admin'
    default:
      return '/'
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
