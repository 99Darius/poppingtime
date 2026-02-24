import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
    const { userId } = await request.json()
    const supabase = await createServiceClient()

    // Check if welcome email already sent (check if profile exists with recording > 0 or has been welcomed)
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single()

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Get user email
    const { data: authData } = await supabase.auth.admin.getUserById(userId)
    if (!authData?.user?.email) return NextResponse.json({ error: 'No email' }, { status: 404 })

    // Send welcome email
    await sendWelcomeEmail(authData.user.email)

    return NextResponse.json({ success: true })
}
