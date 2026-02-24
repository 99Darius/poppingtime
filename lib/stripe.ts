import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
})

export async function getOrCreateStripeCustomer(
    userId: string,
    email: string,
    existingCustomerId?: string | null
): Promise<string> {
    if (existingCustomerId) return existingCustomerId

    const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
    })

    return customer.id
}

export async function createSubscriptionCheckout(
    customerId: string,
    priceId: string,
    userId: string
): Promise<string> {
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?subscribed=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
        metadata: { userId },
    })

    return session.url!
}

export async function createPdfPaymentIntent(
    customerId: string,
    bookId: string,
    userId: string,
    authorString: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const paymentIntent = await stripe.paymentIntents.create({
        amount: 990, // $9.90 in cents
        currency: 'usd',
        customer: customerId,
        metadata: { bookId, userId, type: 'illustrated_book', authorString },
        automatic_payment_methods: { enabled: true },
    })

    return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
    }
}
