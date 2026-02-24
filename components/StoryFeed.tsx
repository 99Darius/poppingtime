'use client'

import { Chapter } from '@/lib/types'
import ChapterCard from './ChapterCard'
import { useEffect, useRef } from 'react'

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
                    <a href={`/books/${bookId}/illustrate`} className="btn-primary" style={{
                        flex: 1,
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    }}>
                        🎨 Create Illustrated Book — $9.90
                    </a>
                )}
            </div>
        </div>
    )
}

function EndBookButton({ bookId }: { bookId: string }) {
    async function handleEnd() {
        if (!confirm('End this book? You can still create an illustrated version, but no more chapters can be added.')) return
        await fetch(`/api/books/${bookId}/end`, { method: 'POST' })
        window.location.reload()
    }

    return (
        <button onClick={handleEnd} className="btn-secondary" style={{ minWidth: 140 }}>
            📕 End Book
        </button>
    )
}
