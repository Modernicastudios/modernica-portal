import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/accept-invitation']
const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'modernicaportal.com'

function getSlugFromHostname(hostname: string): string | null {
  const host = hostname.split(':')[0]
  if (host === 'localhost' || host === '127.0.0.1') return null
  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    return host.replace(`.${ROOT_DOMAIN}`, '')
  }
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  const slug = getSlugFromHostname(hostname)

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (slug) {
    supabaseResponse.headers.set('x-tenant-slug', slug)
  }

  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isApiRoute = pathname.startsWith('/api/')
  const isStaticFile = pathname.startsWith('/_next/') || pathname.includes('.')

  if (isPublicPath || isApiRoute || isStaticFile) {
    return supabaseResponse
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/admin') && user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
