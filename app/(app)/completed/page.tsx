import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function CompletedBooksPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Find all books the user has access to (owner or contributor)
    const { data: ownedBooks } = await supabase
        .from('books')
        .select('id')
        .eq('owner_id', user.id)

    const { data: contributedBooks } = await supabase
        .from('books')
        .select('id, book_contributors!inner(user_id)')
        .eq('book_contributors.user_id', user.id)

    const allBooks = [...(ownedBooks || []), ...(contributedBooks || [])]
    const bookIds = Array.from(new Set(allBooks.map(b => b.id)))

    // 2. Fetch all completed PDFs (illustrated_books) for those books
    let completedBooks: any[] = []
    if (bookIds.length > 0) {
        const { data: illustrated } = await supabase
            .from('illustrated_books')
            .select('id, book_id, pdf_url, created_at, status, books(title)')
            .in('book_id', bookIds)
            .neq('status', 'pending_payment')
            .order('created_at', { ascending: false })

        if (illustrated) {
            completedBooks = illustrated
        }
    }

    return (
        <div className="fade-in" style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 48 }}>🏆</div>
                <div>
                    <h1 className="serif" style={{ fontSize: 32, fontWeight: 700, color: 'var(--purple-deep)', marginBottom: 8 }}>
                        Completed Books
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                        Your fully illustrated PDF stories, ready to read or download.
                    </p>
                </div>
            </div>

            {completedBooks.length === 0 ? (
                <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📚</div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                        No completed books yet
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto' }}>
                        When you finish recording a story and purchase the illustration package, your beautiful PDF books will appear here.
                    </p>
                    <Link href="/books/new" className="btn-primary" style={{ display: 'inline-flex' }}>
                        Start a New Story ✨
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                    {completedBooks.map((book) => (
                        <div key={book.id} className="card fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                                height: 160,
                                background: 'linear-gradient(135deg, var(--purple-pale), #e9d5ff)',
                                borderRadius: '12px 12px 0 0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 48,
                                borderBottom: '1px solid var(--border)'
                            }}>
                                📖
                            </div>
                            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <h3 className="serif" style={{ fontSize: 18, fontWeight: 700, color: 'var(--purple-deep)', marginBottom: 8, lineHeight: 1.3 }}>
                                    {book.books?.title || 'Untitled Story'}
                                </h3>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                                    Generated on {new Date(book.created_at).toLocaleDateString()}
                                </p>

                                <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
                                    {book.status === 'complete' && book.pdf_url ? (
                                        <>
                                            <a
                                                href={book.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-primary"
                                                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                                            >
                                                👁️ View PDF
                                            </a>
                                            <a
                                                href={book.pdf_url}
                                                download={`Popping_Time_${book.books?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'book'}.pdf`}
                                                className="btn-secondary"
                                                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                                            >
                                                📥 Download
                                            </a>
                                        </>
                                    ) : book.status === 'failed' ? (
                                        <div style={{ padding: '10px', background: 'var(--red-light, #fee2e2)', borderRadius: 8, fontSize: 13, color: '#ef4444', textAlign: 'center', width: '100%' }}>
                                            Generation failed. Please try again.
                                        </div>
                                    ) : (
                                        <div style={{ padding: '10px', background: 'var(--cream)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', width: '100%' }}>
                                            {book.status === 'generating' ? 'PDF compiling... (We will email you when ready)' : 'Compiling...'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
