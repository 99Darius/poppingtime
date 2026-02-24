import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookId, authorString } = await request.json()

    // Verify book is ended
    const { data: book } = await supabase.from('books').select('status').eq('id', bookId).single()
    if (!book || book.status !== 'ended') {
        return NextResponse.json({ error: 'Book must be ended first' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // Check credits
    const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('free_pdf_credits')
        .eq('id', user.id)
        .single()

    if (!profile || (profile.free_pdf_credits || 0) <= 0) {
        return NextResponse.json({ error: 'No PDF credits available' }, { status: 400 })
    }

    // Deduct credit
    await serviceClient
        .from('user_profiles')
        .update({ free_pdf_credits: profile.free_pdf_credits - 1 })
        .eq('id', user.id)

    // Generate a dummy payment intent ID to track the job
    const paymentIntentId = `credit_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Create illustrated book record
    await serviceClient.from('illustrated_books').insert({
        book_id: bookId,
        stripe_payment_intent_id: paymentIntentId,
        status: 'generating', // Skip pending_payment
    })

    // Trigger background generation
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    fetch(`${siteUrl}/api/illustrate/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bookId,
            paymentIntentId,
            authorString: authorString || 'Anonymous',
        }),
    }).catch(console.error)

    return NextResponse.json({ success: true, paymentIntentId })
}
