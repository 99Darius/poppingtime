import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Find all books owned by the current user
    const { data: books } = await supabase
        .from('books')
        .select('id')
        .eq('owner_id', user.id)

    if (!books || books.length === 0) {
        return NextResponse.json({ coauthors: [] })
    }

    const bookIds = books.map(b => b.id)

    // 2. Find all contributors to those books
    const { data: contributors } = await supabase
        .from('book_contributors')
        .select('user_id')
        .in('book_id', bookIds)

    if (!contributors || contributors.length === 0) {
        return NextResponse.json({ coauthors: [] })
    }

    // Filter out the owner themselves and get unique IDs
    const uniqueIds = Array.from(new Set(contributors.map(c => c.user_id))).filter(id => id !== user.id)

    if (uniqueIds.length === 0) {
        return NextResponse.json({ coauthors: [] })
    }

    // 3. Fetch user details via admin client
    const serviceClient = await createServiceClient()
    const coauthors = []

    for (const uid of uniqueIds) {
        const { data: authData } = await serviceClient.auth.admin.getUserById(uid)
        if (authData?.user) {
            coauthors.push({
                id: uid,
                email: authData.user.email,
                displayName: authData.user.user_metadata?.display_name || '',
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

    // Verify ownership: does the current user own a book that this coauthor is in?
    const { data: books } = await supabase
        .from('books')
        .select('id')
        .eq('owner_id', user.id)

    const bookIds = books?.map(b => b.id) || []

    const { data: relationship } = await supabase
        .from('book_contributors')
        .select('user_id')
        .eq('user_id', coauthorId)
        .in('book_id', bookIds)
        .limit(1)

    if (!relationship || relationship.length === 0) {
        return NextResponse.json({ error: 'Not authorized to edit this co-author' }, { status: 403 })
    }

    // Update the coauthor's display name using service role
    const serviceClient = await createServiceClient()
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

    // Also explicitly sync to user_profiles table just in case there's no auth trigger
    await serviceClient
        .from('user_profiles')
        .update({ display_name: displayName })
        .eq('id', coauthorId)

    return NextResponse.json({ success: true })
}

