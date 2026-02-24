import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendContributorInviteEmail } from '@/lib/resend'

interface Props {
    params: Promise<{ bookId: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
    const { bookId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { email } = await request.json()

    // Verify book ownership
    const { data: book } = await supabase.from('books').select('title, owner_id').eq('id', bookId).single()
    if (!book || book.owner_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if user exists already
    const serviceClient = await createServiceClient()
    const { data: { users } } = await serviceClient.auth.admin.listUsers()
    const existingUser = users?.find((u) => u.email === email)

    if (existingUser) {
        // Add as contributor directly
        await serviceClient.from('book_contributors').upsert({
            book_id: bookId,
            user_id: existingUser.id,
        })
    }

    // Send invite email regardless
    const inviterName = user.user_metadata?.display_name || user.email || 'Someone'
    await sendContributorInviteEmail(email, inviterName, book.title, bookId).catch(console.error)

    return NextResponse.json({ success: true })
}
