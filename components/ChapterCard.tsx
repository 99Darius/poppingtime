'use client'

import { Chapter } from '@/lib/types'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ChapterCardProps {
    chapter: Chapter
}

export default function ChapterCard({ chapter }: ChapterCardProps) {
    const [showRewrite, setShowRewrite] = useState(false)
    const [rewriteText, setRewriteText] = useState<string | null>(null)
    const [rewriting, setRewriting] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [status, setStatus] = useState(chapter.transcript_status)
    const router = useRouter()

    const transcript = chapter.transcript_cleaned || chapter.transcript_original

    // Polling if processing
    useEffect(() => {
        if (status !== 'processing') return

        const supabase = createClient()
        const interval = setInterval(async () => {
            const { data } = await supabase
                .from('chapters')
                .select('transcript_status')
                .eq('id', chapter.id)
                .single()

            if (data && data.transcript_status !== 'processing') {
                setStatus(data.transcript_status)
                router.refresh() // Refresh to load new transcript
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [status, chapter.id, router])

    const loadAudio = useCallback(async () => {
        if (audioUrl || !chapter.audio_path) return
        const supabase = createClient()
        const { data } = await supabase.storage.from('audio').createSignedUrl(chapter.audio_path, 3600)
        if (data?.signedUrl) setAudioUrl(data.signedUrl)
    }, [audioUrl, chapter.audio_path])

    // Auto-load audio
    useEffect(() => {
        if (!audioUrl && chapter.audio_path) {
            loadAudio()
        }
    }, [audioUrl, chapter.audio_path, loadAudio])

    async function handleRewrite() {
        if (rewriteText) {
            setShowRewrite(!showRewrite)
            return
        }
        setRewriting(true)
        try {
            const res = await fetch(`/api/chapters/${chapter.id}/rewrite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scope: 'chapter' }),
            })
            const data = await res.json()
            setRewriteText(data.content)
            setShowRewrite(true)
        } catch {
            alert('Cleanup failed — please try again.')
        } finally {
            setRewriting(false)
        }
    }

    const statusConfig = {
        pending: { className: 'badge badge-pending', label: '⏳ Pending' },
        processing: { className: 'badge badge-processing', label: '⚙️ Processing' },
        ready: { className: 'badge badge-ready', label: '✓ Ready' },
    }

    const statusDisplay = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
        <div className="card fade-in" style={{ padding: '24px 28px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, var(--purple-pale), #e9d5ff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--purple-mid)',
                    }}>
                        {chapter.chapter_number}
                    </span>
                    <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--purple-deep)' }}>
                            Chapter {chapter.chapter_number}
                        </h3>
                        {!!chapter.duration_seconds && (
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {Math.floor(chapter.duration_seconds / 60)}:{(chapter.duration_seconds % 60).toString().padStart(2, '0')}
                            </p>
                        )}
                    </div>
                </div>
                <span className={statusDisplay.className}>{statusDisplay.label}</span>
            </div>

            {/* Audio player */}
            {chapter.audio_path && audioUrl && (
                <div style={{ marginBottom: 16 }}>
                    <audio controls src={audioUrl} style={{ width: '100%' }} />
                </div>
            )}

            {/* Processing State */}
            {status === 'processing' && (
                <div style={{
                    marginBottom: 12,
                    padding: '32px 20px',
                    background: 'var(--purple-pale)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'center'
                }}>
                    <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3, borderTopColor: 'var(--purple-deep)', borderColor: 'rgba(45,31,78,0.1)' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--purple-deep)', margin: 0 }}>
                        Transcribing your story...
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                        This usually takes about 30 seconds.
                    </p>
                </div>
            )}

            {/* Transcript */}
            {status === 'ready' && transcript && (
                <div style={{ marginBottom: 12 }}>
                    <p className="serif" style={{
                        fontSize: 15,
                        lineHeight: 1.8,
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap',
                    }}>
                        {showRewrite && rewriteText ? rewriteText : transcript}
                    </p>
                </div>
            )}

            {/* Rewrite toggle */}
            {chapter.transcript_status === 'ready' && (
                <div style={{
                    display: 'flex',
                    gap: 8,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border)',
                }}>
                    <button
                        onClick={handleRewrite}
                        className="btn-ghost"
                        disabled={rewriting}
                        style={{ fontSize: 13 }}
                    >
                        {rewriting ? (
                            <><span className="spinner" style={{ width: 14, height: 14 }} /> Cleaning up...</>
                        ) : showRewrite ? (
                            '📝 Show Original'
                        ) : rewriteText ? (
                            '✨ Show Cleanup'
                        ) : (
                            '✨ AI Cleanup'
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}
