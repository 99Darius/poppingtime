'use client'

import { useState } from 'react'
import type { PlotOutput } from '@/lib/ai/plot'

interface PlotGeneratorProps {
    onPlotGenerated?: (title: string) => void;
}

export default function PlotGenerator({ onPlotGenerated }: PlotGeneratorProps) {
    const [plot, setPlot] = useState<PlotOutput | null>(null)
    const [loading, setLoading] = useState(false)
    const [tone, setTone] = useState<string>('funny')

    async function generate() {
        setLoading(true)
        try {
            const res = await fetch('/api/plot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tone }),
            })
            const data = await res.json() as PlotOutput
            setPlot(data)

            // Save to session storage so the recording page can read it
            sessionStorage.setItem('currentPlot', JSON.stringify(data))

            if (onPlotGenerated && data.title) {
                onPlotGenerated(data.title)
            }
        } catch {
            alert('Failed to generate plot. Try again!')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {/* Tone selector */}
            <div style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                marginBottom: 16,
                flexWrap: 'wrap',
            }}>
                {[
                    { value: 'funny', emoji: '😂', label: 'Funny' },
                    { value: 'adventurous', emoji: '⚔️', label: 'Adventure' },
                    { value: 'magical', emoji: '🪄', label: 'Magical' },
                    { value: 'spooky', emoji: '👻', label: 'Spooky' },
                    { value: 'scifi', emoji: '🚀', label: 'Sci-Fi' },
                    { value: 'animal', emoji: '🦊', label: 'Animal' },
                ].map((t) => (
                    <button
                        key={t.value}
                        onClick={() => setTone(t.value)}
                        className={tone === t.value ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '8px 14px', fontSize: 13 }}
                    >
                        {t.emoji} {t.label}
                    </button>
                ))}
            </div>

            <button
                onClick={generate}
                disabled={loading}
                className="btn-primary"
                style={{ margin: '0 auto', display: 'flex', width: '100%', maxWidth: 400, justifyContent: 'center', padding: '16px' }}
            >
                {loading ? (
                    <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Generating plot...</>
                ) : (
                    '🎲 Generate Plot & Characters'
                )}
            </button>

            {/* Plot display */}
            {plot && (
                <div className="card slide-up" style={{
                    marginTop: 24,
                    padding: '28px',
                    textAlign: 'left',
                }}>
                    {/* Hook */}
                    <div style={{ marginBottom: 20 }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--purple-mid)',
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            marginBottom: 4,
                        }}>
                            🪝 Hook
                        </p>
                        <p className="serif" style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                            {plot.hook}
                        </p>
                    </div>

                    {/* Problem */}
                    <div style={{ marginBottom: 20 }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--purple-mid)',
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            marginBottom: 4,
                        }}>
                            💥 Problem
                        </p>
                        <p className="serif" style={{ fontSize: 15, lineHeight: 1.6 }}>
                            {plot.problem}
                        </p>
                    </div>

                    {/* Action */}
                    <div style={{ marginBottom: 20 }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--purple-mid)',
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            marginBottom: 8,
                        }}>
                            📈 Action
                        </p>
                        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {plot.action.map((act, i) => (
                                <li key={i} className="serif" style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                                    {act}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Climax */}
                    <div style={{ marginBottom: 20 }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#f59e0b',
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            marginBottom: 4,
                        }}>
                            ⚡ Climax
                        </p>
                        <p className="serif" style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>
                            {plot.climax}
                        </p>
                    </div>

                    {/* Resolution */}
                    <div style={{ marginBottom: 24 }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#10b981',
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            marginBottom: 4,
                        }}>
                            🌈 Resolution
                        </p>
                        <p className="serif" style={{ fontSize: 15, lineHeight: 1.6 }}>
                            {plot.resolution}
                        </p>
                    </div>

                    {/* Characters */}
                    <div style={{
                        borderTop: '1px solid var(--border)',
                        paddingTop: 20,
                    }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--purple-mid)',
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            marginBottom: 12,
                        }}>
                            🎭 Characters
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {Object.entries(plot.characters).map(([role, desc]) => (
                                desc && (
                                    <div key={role} style={{
                                        padding: '10px 14px',
                                        background: 'var(--purple-pale)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}>
                                        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--purple-mid)', textTransform: 'capitalize', marginBottom: 2 }}>
                                            {role}
                                        </p>
                                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                            {desc}
                                        </p>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
