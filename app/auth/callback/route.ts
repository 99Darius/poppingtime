import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'magiclink' | 'email' | null
    const searchNext = searchParams.get('next')
    const inviter_id = searchParams.get('inviter_id')
    const next = (searchNext === null || searchNext === '/') ? '/dashboard' : searchNext

    console.log('[auth/callback] params:', { code: !!code, token_hash: !!token_hash, type, next })

    const response = NextResponse.redirect(`${origin}${next}`)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    let verified = false

    // Handle token_hash verification (our custom magic link flow via Resend)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        console.log('[auth/callback] verifyOtp result:', error ? error.message : 'success')
        if (!error) verified = true
    }

    // Handle PKCE code exchange (standard Supabase flow)
    if (!verified && code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        console.log('[auth/callback] code exchange result:', error ? error.message : 'success')
        if (!error) verified = true
    }

    if (verified) {
        // Send welcome email for new users and set primary_account_id
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Link account if invited and not already linked
                if (inviter_id && !user.user_metadata?.primary_account_id) {
                    const serviceClient = await createServiceClient()
                    await serviceClient.auth.admin.updateUserById(user.id, {
                        user_metadata: { ...user.user_metadata, primary_account_id: inviter_id }
                    })
                    // Sync up to profile
                    await serviceClient
                        .from('user_profiles')
                        .update({ primary_account_id: inviter_id })
                        .eq('id', user.id)
                }

                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('total_recording_seconds')
                    .eq('id', user.id)
                    .single()

                if (profile && profile.total_recording_seconds === 0) {
                    fetch(`${origin}/api/welcome`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id }),
                    }).catch(() => { })
                }
            }
        } catch { }

        return response
    }

    console.log('[auth/callback] verification failed — redirecting to login')
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
