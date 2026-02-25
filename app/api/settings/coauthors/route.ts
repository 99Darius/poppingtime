import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = await createServiceClient()

    // 1. Find all coauthors linked to this account
    const { data: profiles } = await serviceClient
        .from('user_profiles')
        .select('id, display_name')
        .eq('primary_account_id', user.id)

    if (!profiles || profiles.length === 0) {
        return NextResponse.json({ coauthors: [] })
    }

    // 2. Fetch user emails via admin client
    const coauthors = []
    for (const profile of profiles) {
        const { data: authData } = await serviceClient.auth.admin.getUserById(profile.id)
        if (authData?.user) {
            coauthors.push({
                id: profile.id,
                email: authData.user.email,
                displayName: profile.display_name || authData.user.user_metadata?.display_name || '',
            })
        }
    }

    return NextResponse.json({ coauthors })
}

export async function PATCH(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { coauthorId, displayName } = await request.json()

    if (!coauthorId || typeof displayName !== 'string') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // Verify ownership: does this coauthor belong to the current user's primary account?
    const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('primary_account_id')
        .eq('id', coauthorId)
        .single()

    if (!profile || profile.primary_account_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized to edit this co-author' }, { status: 403 })
    }

    // Update the coauthor's display name using service role
    const { data: currentAuth, error: fetchErr } = await serviceClient.auth.admin.getUserById(coauthorId)

    if (fetchErr) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentMeta = currentAuth?.user?.user_metadata || {}

    const { error: updateErr } = await serviceClient.auth.admin.updateUserById(coauthorId, {
        user_metadata: {
            ...currentMeta,
            display_name: displayName,
        }
    })

    if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Sync to user_profiles table
    await serviceClient
        .from('user_profiles')
        .update({ display_name: displayName })
        .eq('id', coauthorId)

    return NextResponse.json({ success: true })
}

