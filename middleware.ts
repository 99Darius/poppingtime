import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Public routes (root is now public landing)
    const publicRoutes = ['/login', '/auth/callback', '/gift', '/about', '/terms', '/privacy', '/api/welcome', '/api/auth', '/api/stripe/webhook', '/api/illustrate/generate']
    const isPublic = publicRoutes.some((r) => pathname.startsWith(r)) || pathname === '/'

    if (!user && !isPublic) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    const hasAdminBypass = request.cookies.get('admin_bypass')?.value === 'true'

    // Admin route guard
    if (pathname.startsWith('/admin')) {
        if (pathname === '/admin/login') {
            return supabaseResponse
        }
        if (hasAdminBypass) {
            return supabaseResponse
        }
        if (!user || user.email !== process.env.ADMIN_EMAIL) {
            const url = request.nextUrl.clone()
            url.pathname = '/admin/login'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
