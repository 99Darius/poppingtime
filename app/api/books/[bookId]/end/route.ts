import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getPrimaryAccountId } from '@/lib/auth/helper'

interface Props {
    params: Promise<{ bookId: string }>
}

export async function POST(_: NextRequest, { params }: Props) {
    const { bookId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = getPrimaryAccountId(user)
    const serviceClient = await createServiceClient()

    // Verify ownership
    const { data: bookCheck } = await serviceClient.from('books').select('owner_id').eq('id', bookId).single()
    if (!bookCheck || bookCheck.owner_id !== accountId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await serviceClient
        .from('books')
        .update({ status: 'ended', updated_at: new Date().toISOString() })
        .eq('id', bookId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}

