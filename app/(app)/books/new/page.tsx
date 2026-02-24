'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PlotGenerator from '@/components/PlotGenerator'

export default function NewBookPage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [creating, setCreating] = useState(false)

    const [error, setError] = useState('')

    async function handleStart() {
        setCreating(true)
        setError('')
        try {
            const res = await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title || 'My Story' }),
            })
            const data = await res.json()
            if (!res.ok || !data.id) {
                setError(data.error || 'Failed to create story. Please try again.')
                setCreating(false)
                return
            }
            router.push(`/books/${data.id}/record`)
        } catch {
            setError('Something went wrong. Please try again.')
            setCreating(false)
        }
    }

    return (
        <div className="fade-in" style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 32,
            }}>
                ✨
            </div>

            <h1 className="serif" style={{
                fontSize: 28,
                color: 'var(--purple-deep)',
                marginBottom: 8,
            }}>
                Start a New Story
            </h1>
            <p style={{
                color: 'var(--text-secondary)',
                fontSize: 15,
                marginBottom: 32,
                lineHeight: 1.6,
            }}>
                Give your story a title, or jump straight into recording.
            </p>

            {/* Title input */}
            <div style={{ maxWidth: 400, margin: '0 auto 24px' }}>
                <input
                    className="input"
                    placeholder="Story title (e.g. The Dragon's Lost Homework)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ textAlign: 'center', fontSize: 16 }}
                />
            </div>

            {/* Primary CTA */}
            <button
                onClick={handleStart}
                disabled={creating}
                className="btn-primary"
                style={{
                    fontSize: 17,
                    padding: '18px 36px',
                    marginBottom: 20,
                }}
            >
                {creating ? (
                    <><span className="spinner" /> Creating...</>
                ) : (
                    '🎙 Start Recording First Chapter'
                )}
            </button>

            {error && (
                <p style={{ color: '#ef4444', fontSize: 14, marginTop: 12 }}>{error}</p>
            )}

            {/* Divider */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                margin: '32px 0',
                color: 'var(--text-muted)',
                fontSize: 13,
            }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span>or get inspired first</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Plot Generator */}
            <PlotGenerator onPlotGenerated={(generatedTitle) => setTitle(generatedTitle)} />
        </div >
    )
}
