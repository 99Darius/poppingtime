import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createServiceClient()

    const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

    // Enrich with email from auth
    const enriched = []
    for (const p of profiles || []) {
        const { data: authData } = await supabase.auth.admin.getUserById(p.id)
        enriched.push({
            ...p,
            email: authData?.user?.email || 'unknown',
        })
    }

    return NextResponse.json(enriched)
}

export async function PATCH(request: Request) {
    const supabase = await createServiceClient()
    const { id, add_minutes, toggle_sub, add_pdf } = await request.json()

    if (!id) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_recording_seconds, recording_quota_seconds, subscription_status, free_pdf_credits')
        .eq('id', id)
        .single()

    const currentQuota = profile?.recording_quota_seconds || 1800
    let updatePayload: any = {}

    if (typeof add_minutes === 'number') {
        updatePayload.recording_quota_seconds = currentQuota + (add_minutes * 60)
    }

    if (toggle_sub) {
        updatePayload.subscription_status = profile?.subscription_status === 'active' ? 'cancelled' : 'active'
    }

    if (add_pdf) {
        updatePayload.free_pdf_credits = (profile?.free_pdf_credits || 0) + 1
    }

    const { error } = await supabase
        .from('user_profiles')
        .update(updatePayload)
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: updatePayload })
}
