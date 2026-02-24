import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMagicLinkEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
    try {
        const { email, redirectTo } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Use admin client to generate magic link without Supabase sending email
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: {
                redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            },
        })

        if (error) {
            console.error('Generate link error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Build our OWN verification URL using the hashed_token
        // This bypasses Supabase's /auth/v1/verify (which uses implicit flow with fragments)
        // Instead, we put token_hash in query params so our server-side callback can use verifyOtp()
        const hashedToken = data.properties.hashed_token
        const siteUrl = redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        const magicLink = `${siteUrl}?token_hash=${hashedToken}&type=magiclink`

        console.log('[magic-link] Generated link for:', email)

        // Send via Resend
        await sendMagicLinkEmail(email, magicLink)

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Magic link API error:', err)
        return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 })
    }
}
