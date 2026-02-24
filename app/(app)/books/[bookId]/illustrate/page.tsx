'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function IllustratePage() {
    const params = useParams()
    const bookId = params.bookId as string
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [status, setStatus] = useState<'idle' | 'loading' | 'paying' | 'error'>('idle')
    const [showToast, setShowToast] = useState(false)
    const [authorString, setAuthorString] = useState('')
    const [pdfCredits, setPdfCredits] = useState(0)

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
                const { data: profile } = await supabase.from('user_profiles').select('free_pdf_credits').eq('id', user.id).single()
                if (profile) setPdfCredits(profile.free_pdf_credits || 0)
            }
        }
        fetchDefaultAuthor()
    }, [bookId])

    async function handleRedeemCredit() {
        setStatus('loading')
        try {
            const res = await fetch('/api/illustrate/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, authorString }),
            })
            if (res.ok) {
                setShowToast(true)
                setStatus('idle')
            } else {
                setStatus('error')
            }
        } catch {
            setStatus('error')
        }
    }

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            This will be stamped on the cover and the final page of your book.
                        </p>
                        <Link href="/settings" style={{ fontSize: 12, color: 'var(--purple-deep)', fontWeight: 500, textDecoration: 'none' }}>
                            Edit Co-Authors →
                        </Link>
                    </div>
                </div>
            )}

            {status === 'idle' || status === 'loading' || status === 'error' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {pdfCredits > 0 && (
                        <div style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <p style={{ color: '#10b981', fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                                🎁 You have {pdfCredits} Free PDF Credit{pdfCredits > 1 ? 's' : ''}!
                            </p>
                            <button
                                onClick={handleRedeemCredit}
                                disabled={status === 'loading'}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    fontSize: 15,
                                    padding: '14px',
                                    background: '#10b981',
                                }}
                            >
                                {status === 'loading' ? <><span className="spinner" /> Processing...</> : '🎨 Redeem 1 Credit'}
                            </button>
                        </div>
                    )}

                    <button
                        onClick={initPayment}
                        disabled={status === 'loading'}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            fontSize: 15,
                            padding: '14px',
                            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        }}
                    >
                        {status === 'loading' ? (
                            <><span className="spinner" /> Preparing...</>
                        ) : status === 'error' ? (
                            'Try Again'
                        ) : (
                            '💳 Buy Credit ($9.90)'
                        )}
                    </button>
                </div>
            ) : clientSecret && status === 'paying' ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                        onSuccess={(url) => {
                            setShowToast(true)
                            setStatus('idle')
                            setClientSecret(null)
                        }}
                    />
                </Elements>
            ) : null}

            {showToast && (
                <div className="slide-up" style={{
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--purple-deep)',
                    color: 'white',
                    padding: '16px 20px',
                    borderRadius: 12,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    width: '90%',
                    maxWidth: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                            <h4 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Processing Book 🎨</h4>
                            <p style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9 }}>
                                This might take a few minutes. We will email you and it will appear in your completed books section when it is ready.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowToast(false)}
                            style={{ background: 'none', border: 'none', color: 'white', opacity: 0.6, cursor: 'pointer', fontSize: 20 }}
                        >
                            ×
                        </button>
                    </div>
                </div>
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
