'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PlotOutput } from '@/lib/ai/plot'

export default function RecordPage() {
    const router = useRouter()
    const params = useParams()
    const bookId = params.bookId as string

    const [duration, setDuration] = useState(120) // default 2 min in seconds
    const [isRecording, setIsRecording] = useState(false)
    const [elapsed, setElapsed] = useState(0)
    const [uploading, setUploading] = useState(false)
    const [permissionDenied, setPermissionDenied] = useState(false)
    const [activePlot, setActivePlot] = useState<PlotOutput | null>(null)

    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const chunks = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const graceRef = useRef<NodeJS.Timeout | null>(null)

    const isWarning = elapsed >= duration - 30 && elapsed < duration
    const isGrace = elapsed >= duration && elapsed < duration + 30
    const isHardStop = elapsed >= duration + 30

    const stopAndUpload = useCallback(async () => {
        if (mediaRecorder.current?.state === 'recording') {
            mediaRecorder.current.stop()
        }
        if (timerRef.current) clearInterval(timerRef.current)
        if (graceRef.current) clearTimeout(graceRef.current)
        setIsRecording(false)
    }, [])

    // Hard stop effect
    useEffect(() => {
        if (isHardStop && isRecording) {
            stopAndUpload()
        }
    }, [isHardStop, isRecording, stopAndUpload])

    // Load plot from session storage
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem('currentPlot')
            if (saved) {
                setActivePlot(JSON.parse(saved))
            }
        } catch { }
    }, [])

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            chunks.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.current.push(e.data)
            }

            recorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop())
                const blob = new Blob(chunks.current, { type: 'audio/webm' })
                await uploadAudio(blob)
            }

            recorder.start(1000)
            mediaRecorder.current = recorder
            setIsRecording(true)
            setElapsed(0)

            timerRef.current = setInterval(() => {
                setElapsed((prev) => prev + 1)
            }, 1000)
        } catch {
            setPermissionDenied(true)
        }
    }

    async function uploadAudio(blob: Blob) {
        setUploading(true)

        const formData = new FormData()
        formData.append('audioFile', blob, 'chapter.webm')
        formData.append('durationSeconds', elapsed.toString())

        // Upload and create chapter record via server-side API
        await fetch(`/api/books/${bookId}/chapters`, {
            method: 'POST',
            body: formData,
        })

        router.push(`/books/${bookId}`)
    }

    const remaining = Math.max(0, duration + 30 - elapsed)
    const progress = Math.min(elapsed / duration, 1)
    const circumference = 2 * Math.PI * 120

    return (
        <div className="fade-in" style={{
            textAlign: 'center',
            padding: '40px 0',
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {uploading ? (
                <div className="slide-up">
                    <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 20px', borderWidth: 4 }} />
                    <h2 className="serif" style={{ fontSize: 22, color: 'var(--purple-deep)' }}>
                        Uploading your chapter...
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                        This will only take a moment.
                    </p>
                </div>
            ) : permissionDenied ? (
                <div>
                    <h2 className="serif" style={{ fontSize: 22, color: 'var(--purple-deep)', marginBottom: 12 }}>
                        Microphone access needed
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                        Please allow microphone access in your browser settings to record your story.
                    </p>
                    <button onClick={() => setPermissionDenied(false)} className="btn-primary">
                        Try Again
                    </button>
                </div>
            ) : (
                <>
                    {/* Timer ring */}
                    <div style={{ position: 'relative', width: 280, height: 280, margin: '0 auto 32px' }}>
                        <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: 'rotate(-90deg)' }}>
                            <circle
                                cx="140" cy="140" r="120"
                                stroke="var(--border)"
                                strokeWidth="6"
                                fill="none"
                            />
                            {isRecording && (
                                <circle
                                    cx="140" cy="140" r="120"
                                    stroke={isGrace ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--purple-mid)'}
                                    strokeWidth="6"
                                    fill="none"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference * (1 - progress)}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                                />
                            )}
                        </svg>

                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                        }}>
                            {isRecording ? (
                                <>
                                    <p style={{
                                        fontSize: 42,
                                        fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                        color: isGrace ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--purple-deep)',
                                        lineHeight: 1,
                                    }}>
                                        {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                        {isGrace ? 'Grace period' : isWarning ? 'Almost time' : 'remaining'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p style={{
                                        fontSize: 42,
                                        fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                        color: 'var(--purple-deep)',
                                        lineHeight: 1,
                                    }}>
                                        {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                        recording time
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Duration slider (only before recording) */}
                    {!isRecording && (
                        <div style={{ marginBottom: 32, width: '100%', maxWidth: 300 }}>
                            <input
                                type="range"
                                min={60}
                                max={480}
                                step={30}
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    accentColor: 'var(--purple-mid)',
                                }}
                            />
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                {Math.floor(duration / 60)} min {duration % 60 > 0 ? `${duration % 60}s` : ''}
                            </p>
                        </div>
                    )}

                    {/* Record / Stop button */}
                    {isRecording ? (
                        <button
                            onClick={stopAndUpload}
                            className="btn-record recording"
                            style={{
                                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                                boxShadow: '0 8px 32px rgba(107, 114, 128, 0.4)',
                                width: 100,
                                height: 100,
                            }}
                        >
                            <span style={{ fontSize: 28 }}>⏹</span>
                            <span style={{ fontSize: 12 }}>Stop</span>
                        </button>
                    ) : (
                        <button onClick={startRecording} className="btn-record">
                            <span style={{ fontSize: 32 }}>🎙</span>
                            <span>Record</span>
                        </button>
                    )}

                    {isGrace && (
                        <p style={{
                            color: '#ef4444',
                            fontSize: 14,
                            fontWeight: 600,
                            marginTop: 16,
                            animation: 'fadeIn 0.3s',
                        }}>
                            ⚠️ Grace period — recording will stop in {remaining}s
                        </p>
                    )}

                    {/* Active Plot Display */}
                    {activePlot && (
                        <div className="card slide-up" style={{
                            marginTop: 48,
                            padding: '24px',
                            textAlign: 'left',
                            width: '100%',
                            maxWidth: 600,
                            background: '#fff',
                        }}>
                            <h3 className="serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--purple-deep)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>💡</span> Story Inspiration
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple-mid)', textTransform: 'uppercase', marginRight: 8 }}>🪝 Hook:</span>
                                    <span className="serif" style={{ fontSize: 18, lineHeight: 1.5 }}>{activePlot.hook}</span>
                                </div>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple-mid)', textTransform: 'uppercase', marginRight: 8 }}>💥 Problem:</span>
                                    <span className="serif" style={{ fontSize: 18, lineHeight: 1.5 }}>{activePlot.problem}</span>
                                </div>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple-mid)', textTransform: 'uppercase', marginRight: 8 }}>📈 Action:</span>
                                    <span className="serif" style={{ fontSize: 18, lineHeight: 1.5 }}>{activePlot.action.join(' → ')}</span>
                                </div>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', marginRight: 8 }}>⚡ Climax:</span>
                                    <span className="serif" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.5 }}>{activePlot.climax}</span>
                                </div>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981', textTransform: 'uppercase', marginRight: 8 }}>🌈 Resolution:</span>
                                    <span className="serif" style={{ fontSize: 18, lineHeight: 1.5 }}>{activePlot.resolution}</span>
                                </div>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple-mid)', textTransform: 'uppercase', marginRight: 8 }}>👥 Characters:</span>
                                    <ul style={{ margin: '8px 0 0 24px', padding: 0, fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        {activePlot.characters.protagonist && <li><strong>Protagonist:</strong> {activePlot.characters.protagonist}</li>}
                                        {activePlot.characters.companion && <li><strong>Companion:</strong> {activePlot.characters.companion}</li>}
                                        {activePlot.characters.mentor && <li><strong>Mentor:</strong> {activePlot.characters.mentor}</li>}
                                        {activePlot.characters.antagonist && <li><strong>Antagonist:</strong> {activePlot.characters.antagonist}</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
