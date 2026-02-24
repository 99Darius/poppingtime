'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface Props {
    totalSeconds: number
    subscriptionStatus: string
}

export default function SubscriptionGate({ totalSeconds, subscriptionStatus }: Props) {
    const [loading, setLoading] = useState(false)

    if (totalSeconds < 1800 || subscriptionStatus === 'active') return null

    async function handleSubscribe(plan: 'monthly' | 'annual') {
        setLoading(true)
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            })
            const data = await res.json()
            if (data.url) window.location.href = data.url
        } catch {
            alert('Failed to start checkout')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(45, 31, 78, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
        }}>
            <div className="card slide-up" style={{
                maxWidth: 420,
                width: '100%',
                padding: '40px 32px',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
                <h2 className="serif" style={{ fontSize: 24, color: 'var(--purple-deep)', marginBottom: 8 }}>
                    You&apos;ve used your free 30 minutes
                </h2>
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: 15,
                    lineHeight: 1.6,
                    marginBottom: 28,
                }}>
                    Subscribe to keep recording unlimited chapters and continue your storytelling ritual.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                        onClick={() => handleSubscribe('monthly')}
                        disabled={loading}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        $1.99/month
                    </button>
                    <button
                        onClick={() => handleSubscribe('annual')}
                        disabled={loading}
                        className="btn-secondary"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        $19.99/year
                        <span style={{
                            position: 'absolute',
                            top: -8,
                            right: 12,
                            background: '#10b981',
                            color: 'white',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 10,
                        }}>
                            SAVE 16%
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}
