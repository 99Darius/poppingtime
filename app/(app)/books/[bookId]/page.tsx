import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Book, Chapter } from '@/lib/types'
import StoryFeed from '@/components/StoryFeed'
import DeleteBookButton from './DeleteBookButton'

interface Props {
    params: Promise<{ bookId: string }>
}

export default async function BookPage({ params }: Props) {
    const { bookId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: book } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single()

    if (!book) redirect('/')

    const { data: chapters } = await supabase
        .from('chapters')
        .select('*')
        .eq('book_id', bookId)
        .order('chapter_number', { ascending: true })

    // Fetch illustrated book PDF if available
    const { data: illustratedBooks } = await supabase
        .from('illustrated_books')
        .select('id, status, download_url')
        .eq('book_id', bookId)
        .eq('status', 'complete')
        .order('created_at', { ascending: false })

    const illustratedBook = illustratedBooks?.[0]

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                    <a href="/dashboard" className="btn-ghost" style={{ marginBottom: 8, display: 'inline-block', fontSize: 13 }}>
                        ← Back to library
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
                        <h1 className="serif" style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: 'var(--purple-deep)',
                            margin: 0,
                        }}>
                            {(book as Book).title}
                        </h1>
                        <DeleteBookButton bookId={bookId} />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: illustratedBook?.download_url ? 12 : 0 }}>
                        {(chapters as Chapter[])?.length || 0} chapters · {(book as Book).status === 'ended' ? 'Completed' : 'In progress'}
                    </p>

                    {/* View Illustrated Book buttons - moved under chapter count */}
                    {illustratedBooks && illustratedBooks.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                            {illustratedBooks.map((ib, index) => ib.download_url && (
                                <a
                                    key={ib.id}
                                    href={ib.download_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary"
                                    style={{
                                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                        padding: '8px 16px',
                                        fontSize: 13,
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 4px 16px rgba(249, 115, 22, 0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    📖 View Illustrated Book {illustratedBooks.length > 1 ? `v${illustratedBooks.length - index}` : ''}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <StoryFeed
                chapters={(chapters as Chapter[]) || []}
                bookId={bookId}
                bookStatus={(book as Book).status}
                bookTitle={(book as Book).title}
            />
        </div>
    )
}
