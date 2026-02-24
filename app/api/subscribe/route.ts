import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getOrCreateStripeCustomer, createSubscriptionCheckout } from '@/lib/stripe'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await request.json()
    const serviceClient = await createServiceClient()

    const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

    const customerId = await getOrCreateStripeCustomer(user.id, user.email!, profile?.stripe_customer_id)

    if (!profile?.stripe_customer_id) {
        await serviceClient.from('user_profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const priceId = plan === 'annual'
        ? process.env.STRIPE_ANNUAL_PRICE_ID!
        : process.env.STRIPE_MONTHLY_PRICE_ID!

    const url = await createSubscriptionCheckout(customerId, priceId, user.id)

    return NextResponse.json({ url })
}
