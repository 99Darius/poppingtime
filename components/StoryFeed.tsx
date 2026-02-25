'use client'

import { Chapter } from '@/lib/types'
import ChapterCard from './ChapterCard'
import { useEffect, useRef, useState } from 'react'

interface StoryFeedProps {
    chapters: Chapter[]
    bookId: string
    bookStatus: string
    bookTitle: string
}

export default function StoryFeed({ chapters, bookId, bookStatus, bookTitle }: StoryFeedProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Auto-scroll to latest chapter
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chapters.length])

    return (
        <div>
            {/* Chapters */}
            {chapters.length === 0 ? (
                <div className="card" style={{
                    padding: '48px 32px',
                    textAlign: 'center',
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 16 }}>
                        No chapters yet — time to start recording!
                    </p>
                    <a href={`/books/${bookId}/record`} className="btn-primary">
                        🎙 Record First Chapter
                    </a>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {chapters.map((chapter) => (
                        <ChapterCard key={chapter.id} chapter={chapter} />
                    ))}
                </div>
            )}

            <div ref={bottomRef} />

            {/* Bottom actions */}
            <div style={{
                marginTop: 28,
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
            }}>
                {bookStatus === 'active' && chapters.length > 0 && (
                    <>
                        <a href={`/books/${bookId}/record`} className="btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: 200 }}>
                            🎙 Record Next Chapter
                        </a>
                        <EndBookButton bookId={bookId} />
                    </>
                )}
                {bookStatus === 'ended' && (
                    <>
                        <a href={`/books/${bookId}/illustrate`} className="btn-primary" style={{
                            flex: 1,
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        }}>
                            🎨 Create Illustrated Book
                        </a>
                        <AiCleanupButton bookId={bookId} />
                    </>
                )}
            </div>

            {/* Floating Action Button for Mobile */}
            {bookStatus === 'ended' && (
                <a href={`/books/${bookId}/illustrate`} className="btn-primary slide-up" style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 50,
                    boxShadow: '0 8px 32px rgba(249, 115, 22, 0.4)',
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    borderRadius: 999,
                    padding: '16px 24px',
                }}>
                    🎨 Create Illustrated Book
                </a>
            )}
        </div>
    )
}

function EndBookButton({ bookId }: { bookId: string }) {
    const [showModal, setShowModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleEnd() {
        setIsLoading(true)
        try {
            await fetch(`/api/books/${bookId}/end`, { method: 'POST' })
            window.location.reload()
        } catch {
            setIsLoading(false)
            setShowModal(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="btn-secondary"
                style={{ minWidth: 140 }}
            >
                📕 End Book
            </button>

            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 20
                }}>
                    <div className="card slide-up" style={{
                        padding: 32,
                        maxWidth: 400,
                        width: '100%',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📕</div>
                        <h3 className="serif" style={{ fontSize: 24, color: 'var(--purple-deep)', marginBottom: 12 }}>
                            End this book?
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
                            You can still create an illustrated version, but no more recording chapters can be added.
                        </p>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                className="btn-ghost"
                                onClick={() => setShowModal(false)}
                                disabled={isLoading}
                                style={{ flex: 1, padding: '12px' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleEnd}
                                disabled={isLoading}
                                style={{ flex: 1, padding: '12px', justifyContent: 'center', background: '#ef4444' }}
                            >
                                {isLoading ? <span className="spinner" /> : 'End Book'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function AiCleanupButton({ bookId }: { bookId: string }) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleCleanup() {
        if (!confirm('This will scan the entire book and permanently fix typos, spelling, and character name continuity errors (e.g. converting "cart" to "card" if misheard by voice dictation). This cannot be undone. Proceed?')) {
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch(`/api/books/${bookId}/cleanup-all`, { method: 'POST' })
            if (!res.ok) throw new Error('Cleanup failed')
            window.location.reload()
        } catch (e) {
            console.error(e)
            alert('Failed to run cleanup.')
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleCleanup}
            disabled={isLoading}
            className="btn-secondary"
            style={{ flex: 1, justifyContent: 'center', color: 'var(--purple-deep)', borderColor: 'var(--purple-deep)' }}
        >
            {isLoading ? <span className="spinner" style={{ borderColor: 'var(--purple-deep)', borderTopColor: 'transparent' }} /> : '✨ Whole Book AI Cleanup'}
        </button>
    )
}
