'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MobileNav({ currentBooks, completedBooks }: { currentBooks: any[], completedBooks: any[] }) {
    const [open, setOpen] = useState(false)

    return (
        <div className="md:hidden">
            <button
                onClick={() => setOpen(true)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: 24,
                    color: 'var(--purple-deep)',
                    cursor: 'pointer',
                    padding: '8px 8px 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    marginRight: 8
                }}
            >
                ☰
            </button>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 9999,
                        backdropFilter: 'blur(2px)'
                    }}
                >
                    <div
                        className="slide-up"
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: 280,
                            background: 'var(--cream)',
                            boxShadow: 'var(--shadow-medium)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--purple-deep)' }}>Menu</span>
                            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                        </div>

                        <div style={{ padding: '0 24px 16px' }}>
                            <Link href="/books/new" className="btn-primary" style={{ padding: '8px 16px', fontSize: 14, width: '100%', textAlign: 'center' }} onClick={() => setOpen(false)}>
                                + New Story
                            </Link>
                        </div>

                        {/* Current Books */}
                        <div style={{ padding: '0 16px', marginBottom: 24 }}>
                            <p style={{
                                fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                                textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 8px 4px',
                                marginBottom: 4
                            }}>
                                Current Books
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {currentBooks.map((book: any) => (
                                    <Link key={book.id} href={`/books/${book.id}`} onClick={() => setOpen(false)} style={{
                                        textDecoration: 'none',
                                        color: 'var(--purple-deep)',
                                        fontSize: 15,
                                        padding: '10px 12px',
                                        borderRadius: 'var(--radius-sm)',
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }} className="sidebar-link">
                                        📖 {book.title || 'Untitled Story'}
                                    </Link>
                                ))}
                                {currentBooks.length === 0 && (
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 8px' }}>No active stories.</p>
                                )}
                            </div>
                        </div>

                        {/* Completed Books */}
                        <div style={{ padding: '0 16px', marginBottom: 24 }}>
                            <p style={{
                                fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                                textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 8px 4px',
                                marginBottom: 4
                            }}>
                                Completed Books
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {completedBooks.map((book: any) => {
                                    const completedIbs = book.illustrated_books?.filter((ib: any) => ib.status === 'complete' && ib.download_url) || []
                                    return (
                                        <div key={book.id}>
                                            <Link href={`/books/${book.id}`} onClick={() => setOpen(false)} style={{
                                                textDecoration: 'none',
                                                color: 'var(--text-secondary)',
                                                fontSize: 15,
                                                padding: '10px 12px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontWeight: 500,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: 'block'
                                            }} className="sidebar-link">
                                                🏆 {book.title || 'Untitled Story'}
                                            </Link>
                                            {completedIbs.map((ib: any, index: number) => (
                                                <a key={ib.id} href={ib.download_url} target="_blank" rel="noopener noreferrer" style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    fontSize: 12,
                                                    color: 'white',
                                                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                                    padding: '4px 12px',
                                                    borderRadius: 12,
                                                    marginLeft: 12,
                                                    marginTop: 4,
                                                    marginBottom: index === completedIbs.length - 1 ? 8 : 4,
                                                    textDecoration: 'none',
                                                    fontWeight: 600,
                                                }}>
                                                    📱 View PDF {completedIbs.length > 1 ? `v${completedIbs.length - index}` : ''}
                                                </a>
                                            ))}
                                        </div>
                                    )
                                })}
                                {completedBooks.length === 0 && (
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 8px' }}>No completed books yet.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}
