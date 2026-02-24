import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    const supabase = await createServiceClient()

    switch (event.type) {
        case 'payment_intent.succeeded': {
            const pi = event.data.object as Stripe.PaymentIntent
            if (pi.metadata.type === 'illustrated_book') {
                // Trigger PDF generation in background
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
                fetch(`${siteUrl}/api/illustrate/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bookId: pi.metadata.bookId,
                        paymentIntentId: pi.id,
                        authorString: pi.metadata.authorString,
                    }),
                }).catch(console.error)
            }
            break
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
            const sub = event.data.object as Stripe.Subscription
            const customerId = sub.customer as string

            // Find user by stripe customer id
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .single()

            if (profile) {
                await supabase
                    .from('user_profiles')
                    .update({
                        subscription_status: sub.status === 'active' ? 'active' : 'cancelled',
                        subscription_price_id: sub.items.data[0]?.price.id || null,
                    })
                    .eq('id', profile.id)
            }
            break
        }

        case 'customer.subscription.deleted': {
            const sub = event.data.object as Stripe.Subscription
            const customerId = sub.customer as string

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .single()

            if (profile) {
                await supabase
                    .from('user_profiles')
                    .update({ subscription_status: 'cancelled' })
                    .eq('id', profile.id)
            }
            break
        }
    }

    return NextResponse.json({ received: true })
}
