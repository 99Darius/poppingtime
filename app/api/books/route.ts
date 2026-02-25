import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getPrimaryAccountId } from '@/lib/auth/helper'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title } = await request.json()
    const accountId = getPrimaryAccountId(user)

    // Use service client to bypass RLS (avoids infinite recursion in books policy)
    const serviceClient = await createServiceClient()

    const { data: book, error } = await serviceClient
        .from('books')
        .insert({
            owner_id: accountId,
            title: title || 'My Story',
        })
        .select()
        .single()

    if (error) {
        console.error('[books] Create error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add owner as contributor too
    await serviceClient.from('book_contributors').insert({
        book_id: book.id,
        user_id: user.id,
    })

    return NextResponse.json(book)
}
