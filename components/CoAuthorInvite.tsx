'use client'

import { useState } from 'react'

interface Props {
    bookId: string
    isOwner: boolean
}

export default function CoAuthorInvite({ bookId, isOwner }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

    if (!isOwner) return null

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault()
        if (!email) return
        setLoading(true)
        setStatus('idle')

        try {
            const res = await fetch(`/api/books/${bookId}/contributors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            if (res.ok) {
                setStatus('success')
                setEmail('')
                setTimeout(() => setIsOpen(false), 2000)
            } else {
                setStatus('error')
            }
        } catch {
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-ghost"
                style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            >
                👥 Add Co-Author
            </button>

            {isOpen && (
                <div className="card fade-in" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 8,
                    padding: 20,
                    width: 300,
                    zIndex: 100,
                    boxShadow: '0 12px 32px rgba(45,31,78,0.15)',
                    border: '1px solid var(--border)'
                }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--purple-deep)', marginBottom: 4 }}>
                        Invite a Co-Author
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                        They'll receive an email link to instantly join and record chapters for this story.
                    </p>

                    <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input
                            type="email"
                            placeholder="Email address"
                            required
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ padding: '8px 12px', fontSize: 13 }}
                        />
                        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '8px', fontSize: 13 }}>
                            {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Sending...</> : 'Send Invite'}
                        </button>
                    </form>

                    {status === 'success' && (
                        <p style={{ color: '#10b981', fontSize: 12, marginTop: 12, fontWeight: 500, textAlign: 'center' }}>
                            ✓ Invite sent!
                        </p>
                    )}
                    {status === 'error' && (
                        <p style={{ color: '#ef4444', fontSize: 12, marginTop: 12, fontWeight: 500, textAlign: 'center' }}>
                            Failed to send invite.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
