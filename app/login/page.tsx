'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginContent() {
    const searchParams = useSearchParams()
    const next = searchParams.get('next')
    const inviterId = searchParams.get('inviter_id')
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const params = new URLSearchParams()
            if (next) params.append('next', next)
            if (inviterId) params.append('inviter_id', inviterId)

            const queryString = params.toString() ? `?${params.toString()}` : ''

            const res = await fetch('/api/auth/magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    redirectTo: `${window.location.origin}/auth/callback${queryString}`,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to send magic link')
                setLoading(false)
            } else {
                setSent(true)
                setLoading(false)
            }
        } catch {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2d1f4e 0%, #4c1d95 50%, #7c5cbf 100%)',
            padding: '20px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: 420,
                textAlign: 'center',
            }} className="fade-in">
                {/* Logo area */}
                <div style={{ marginBottom: 40 }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        fontSize: 28,
                    }}>
                        📖
                    </div>
                    <h1 className="serif" style={{
                        color: 'white',
                        fontSize: 28,
                        fontWeight: 700,
                        marginBottom: 8,
                    }}>
                        Popping Time
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.65)',
                        fontSize: 15,
                        lineHeight: 1.5,
                    }}>
                        Build bedtime stories together.
                    </p>
                </div>

                {/* Card */}
                <div className="card" style={{ padding: '36px 32px' }}>
                    {sent ? (
                        <div className="slide-up">
                            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
                            <h2 className="serif" style={{
                                fontSize: 20,
                                marginBottom: 10,
                                color: 'var(--purple-deep)',
                            }}>
                                Check your email
                            </h2>
                            <p style={{
                                color: 'var(--text-secondary)',
                                fontSize: 14,
                                lineHeight: 1.6,
                            }}>
                                We sent a magic link to <strong>{email}</strong>.<br />
                                Click it to sign in — no password needed.
                            </p>
                            <button
                                className="btn-ghost"
                                onClick={() => { setSent(false); setEmail('') }}
                                style={{ marginTop: 20 }}
                            >
                                ← Try another email
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin}>
                            <h2 className="serif" style={{
                                fontSize: 20,
                                marginBottom: 4,
                                color: 'var(--purple-deep)',
                            }}>
                                Sign in to your stories
                            </h2>
                            <p style={{
                                color: 'var(--text-muted)',
                                fontSize: 13,
                                marginBottom: 24,
                            }}>
                                Enter your email to receive a magic link
                            </p>

                            <input
                                className="input"
                                type="email"
                                placeholder="parent@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                                style={{ marginBottom: 16 }}
                            />

                            {error && (
                                <p style={{
                                    color: '#ef4444',
                                    fontSize: 13,
                                    marginBottom: 12,
                                }}>{error}</p>
                            )}

                            <button
                                className="btn-primary"
                                type="submit"
                                disabled={loading}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {loading ? (
                                    <><span className="spinner" /> Sending...</>
                                ) : (
                                    'Send Magic Link ✨'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <p style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 12,
                    marginTop: 28,
                }}>
                    Building digital heirlooms • thepoppingtime.com
                </p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    )
}
