'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function IllustratePage() {
    const params = useParams()
    const bookId = params.bookId as string
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [status, setStatus] = useState<'idle' | 'loading' | 'paying' | 'generating' | 'complete' | 'error'>('idle')
    const [downloadUrl, setDownloadUrl] = useState<string>('')
    const [authorString, setAuthorString] = useState('')

    useEffect(() => {
        async function fetchDefaultAuthor() {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const name = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous'
                const childName = user.user_metadata?.child_name
                let defaultStr = name

                if (childName) defaultStr += ` & ${childName}`

                const { data: contribs } = await supabase.from('book_contributors').select('user_id').eq('book_id', bookId)
                if (contribs && contribs.length > 0) {
                    defaultStr += ` (and ${contribs.length} co-author${contribs.length > 1 ? 's' : ''})`
                }

                setAuthorString(defaultStr)
            }
        }
        fetchDefaultAuthor()
    }, [bookId])

    async function initPayment() {
        setStatus('loading')
        try {
            const res = await fetch('/api/illustrate/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, authorString }),
            })
            const data = await res.json()
            if (data.clientSecret) {
                setClientSecret(data.clientSecret)
                setStatus('paying')
            } else {
                setStatus('error')
            }
        } catch {
            setStatus('error')
        }
    }

    if (status === 'complete') {
        return (
            <div className="slide-up" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
                <h2 className="serif" style={{ fontSize: 24, color: 'var(--purple-deep)', marginBottom: 10 }}>
                    Your illustrated book is ready!
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                    A download link has also been sent to your email.
                </p>
                {downloadUrl && (
                    <a href={downloadUrl} target="_blank" className="btn-primary" style={{ fontSize: 16 }}>
                        📥 Download PDF
                    </a>
                )}
            </div>
        )
    }

    if (status === 'generating') {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 24px', borderWidth: 4 }} />
                <h2 className="serif" style={{ fontSize: 22, color: 'var(--purple-deep)', marginBottom: 8 }}>
                    Creating your illustrated book...
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                    Our AI is generating unique illustrations for each chapter.<br />
                    This may take a few minutes. Don&apos;t close this page.
                </p>
            </div>
        )
    }

    return (
        <div className="fade-in" style={{ maxWidth: 440, margin: '0 auto', padding: '40px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
                <h1 className="serif" style={{ fontSize: 26, color: 'var(--purple-deep)', marginBottom: 8 }}>
                    Create Your Illustrated Book
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                    Turn your story into a beautifully illustrated PDF with AI-generated art, professional layout, and a keepsake QR code.
                </p>
            </div>

            {/* Price card */}
            <div className="card" style={{ padding: '28px', textAlign: 'center', marginBottom: 24 }}>
                <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--purple-deep)', marginBottom: 4 }}>
                    $9.90
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    One-time purchase · PDF download
                </p>

                <div style={{
                    marginTop: 20,
                    padding: '12px 16px',
                    background: 'var(--purple-pale)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    textAlign: 'left',
                }}>
                    <p>✓ AI-generated illustration per chapter</p>
                    <p>✓ Professional PDF layout</p>
                    <p>✓ Cover page design</p>
                    <p>✓ &ldquo;Created with Popping Time&rdquo; keepsake</p>
                </div>
            </div>

            {/* Author Confirmation */}
            {status === 'idle' && (
                <div style={{ marginBottom: 24, textAlign: 'left' }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        Confirm Authors (Printed on book)
                    </label>
                    <input
                        type="text"
                        className="input"
                        value={authorString}
                        onChange={(e) => setAuthorString(e.target.value)}
                        placeholder="e.g. Daddy, Mommy & Timmy"
                    />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        This will be stamped on the cover and the final page of your book.
                    </p>
                </div>
            )}

            {clientSecret && status === 'paying' ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                        onSuccess={(url) => {
                            setStatus('generating')
                            // Poll for completion
                            const poll = setInterval(async () => {
                                try {
                                    const res = await fetch(`/api/books/${bookId}`)
                                    const book = await res.json()
                                    // Check illustrated_books status — simplified polling
                                } catch { }
                            }, 5000)
                            // Set a timeout for the generating state
                            setTimeout(() => {
                                setDownloadUrl(url || '')
                                setStatus('complete')
                                clearInterval(poll)
                            }, 60000)
                        }}
                    />
                </Elements>
            ) : (
                <button
                    onClick={initPayment}
                    disabled={status === 'loading'}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        fontSize: 16,
                        padding: '16px',
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    }}
                >
                    {status === 'loading' ? (
                        <><span className="spinner" /> Preparing...</>
                    ) : status === 'error' ? (
                        'Try Again'
                    ) : (
                        '🎨 Purchase Illustrated Book — $9.90'
                    )}
                </button>
            )}
        </div>
    )
}

function CheckoutForm({ onSuccess }: { onSuccess: (url?: string) => void }) {
    const stripe = useStripe()
    const elements = useElements()
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!stripe || !elements) return
        setProcessing(true)
        setError('')

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href,
            },
            redirect: 'if_required',
        })

        if (error) {
            setError(error.message || 'Payment failed')
            setProcessing(false)
        } else if (paymentIntent?.status === 'succeeded') {
            onSuccess()
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                <PaymentElement />
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="btn-primary"
                style={{
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: 16,
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                }}
            >
                {processing ? <><span className="spinner" /> Processing...</> : 'Pay $9.90'}
            </button>
        </form>
    )
}
