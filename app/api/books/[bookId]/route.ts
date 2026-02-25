import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getPrimaryAccountId } from '@/lib/auth/helper'

interface Props {
    params: Promise<{ bookId: string }>
}

export async function GET(_: NextRequest, { params }: Props) {
    const { bookId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = getPrimaryAccountId(user)
    const serviceClient = await createServiceClient()

    const { data: book } = await serviceClient
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single()

    if (!book || book.owner_id !== accountId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json(book)
}

export async function PATCH(request: NextRequest, { params }: Props) {
    const { bookId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const accountId = getPrimaryAccountId(user)
    const serviceClient = await createServiceClient()

    // Verify ownership
    const { data: bookCheck } = await serviceClient.from('books').select('owner_id').eq('id', bookId).single()
    if (!bookCheck || bookCheck.owner_id !== accountId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: book, error } = await serviceClient
        .from('books')
        .update({ title: body.title, updated_at: new Date().toISOString() })
        .eq('id', bookId)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(book)
}

export async function DELETE(request: NextRequest, { params }: Props) {
    const { bookId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = getPrimaryAccountId(user)
    const serviceClient = await createServiceClient()

    // Verify ownership
    const { data: book } = await serviceClient
        .from('books')
        .select('owner_id')
        .eq('id', bookId)
        .single()

    if (!book) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    if (book.owner_id !== accountId) {
        return NextResponse.json({ error: 'Only the book account owner can delete this book' }, { status: 403 })
    }

    // Database CASCADE deletes will handle clearing chapters, logs, illustate data, etc.
    const { error } = await serviceClient
        .from('books')
        .delete()
        .eq('id', bookId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

