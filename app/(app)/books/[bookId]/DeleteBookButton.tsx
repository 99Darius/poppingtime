'use client'

import { useState } from 'react'

export default function DeleteBookButton({ bookId }: { bookId: string }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showModal, setShowModal] = useState(false)

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/books/${bookId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                // Force a hard navigation so layout re-fetches
                window.location.href = '/dashboard'
            } else {
                alert('Failed to delete book')
                setIsDeleting(false)
                setShowModal(false)
            }
        } catch (e) {
            alert('An error occurred while deleting the book.')
            setIsDeleting(false)
            setShowModal(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                disabled={isDeleting}
                className="btn-ghost"
                style={{
                    color: '#ef4444',
                    fontSize: 13,
                    padding: '6px 12px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
                title="Delete Book"
            >
                {isDeleting ? 'Deleting...' : '🗑️ Delete Book'}
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
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
                        <h3 className="serif" style={{ fontSize: 24, color: 'var(--purple-deep)', marginBottom: 12 }}>
                            Delete this book?
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
                            Are you absolutely sure you want to delete this book? This action cannot be undone and will permanently delete all chapters and audio recordings associated with it.
                        </p>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                className="btn-ghost"
                                onClick={() => setShowModal(false)}
                                disabled={isDeleting}
                                style={{ flex: 1, padding: '12px' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                style={{ flex: 1, padding: '12px', justifyContent: 'center', background: '#ef4444' }}
                            >
                                {isDeleting ? <span className="spinner" /> : 'Yes, Delete Book'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
