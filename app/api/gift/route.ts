import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendGiftEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookId, email } = await request.json()

    // Verify book ownership
    const { data: book } = await supabase.from('books').select('title, owner_id').eq('id', bookId).single()
    if (!book || book.owner_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()
    const { data: gift } = await serviceClient
        .from('gift_access')
        .insert({ book_id: bookId, email })
        .select()
        .single()

    if (!gift) return NextResponse.json({ error: 'Failed to create gift' }, { status: 500 })

    // Send email
    const senderName = user.user_metadata?.display_name || user.email || 'Someone'
    await sendGiftEmail(email, senderName, book.title, gift.token).catch(console.error)

    return NextResponse.json({ token: gift.token })
}
