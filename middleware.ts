import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { getSlugFromHostname, isCustomDomain } from '@/lib/tenant/resolver'

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/accept-invitation']
const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Resolve tenant slug from hostname
  const slug = getSlugFromHostname(hostname)
  const isCustom = isCustomDomain(hostname)

  // Update Supabase auth session
  const { supabaseResponse, user, supabase } = await updateSession(request)

  // Add tenant info to request headers for downstream use
  if (slug) {
    supabaseResponse.headers.set('x-tenant-slug', slug)
    if (isCustom) {
      supabaseResponse.headers.set('x-tenant-custom-domain', hostname)
    }
  }

  // Skip auth check for public paths and API routes
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isApiRoute = pathname.startsWith('/api/')
  const isStaticFile = pathname.startsWith('/_next/') || pathname.includes('.')

  if (isPublicPath || isApiRoute || isStaticFile) {
    return supabaseResponse
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check super admin access
  if (pathname.startsWith('/admin')) {
    if (user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
