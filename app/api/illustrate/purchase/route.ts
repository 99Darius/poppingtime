import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getOrCreateStripeCustomer, createPdfPaymentIntent } from '@/lib/stripe'

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

    // Get or create Stripe customer
    const serviceClient = await createServiceClient()
    const { data: profile } = await serviceClient.from('user_profiles').select('stripe_customer_id').eq('id', user.id).single()

    const customerId = await getOrCreateStripeCustomer(user.id, user.email!, profile?.stripe_customer_id)

    // Save customer ID if new
    if (!profile?.stripe_customer_id) {
        await serviceClient.from('user_profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const { clientSecret, paymentIntentId } = await createPdfPaymentIntent(customerId, bookId, user.id, authorString || 'Anonymous')

    // Create illustrated book record
    await serviceClient.from('illustrated_books').insert({
        book_id: bookId,
        stripe_payment_intent_id: paymentIntentId,
        status: 'pending_payment',
    })

    return NextResponse.json({ clientSecret })
}
