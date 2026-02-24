import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Book, Chapter } from '@/lib/types'
import StoryFeed from '@/components/StoryFeed'
import CoAuthorInvite from '@/components/CoAuthorInvite'

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

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                    <a href="/dashboard" className="btn-ghost" style={{ marginBottom: 8, display: 'inline-block', fontSize: 13 }}>
                        ← Back to library
                    </a>
                    <h1 className="serif" style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: 'var(--purple-deep)',
                        marginBottom: 4,
                    }}>
                        {(book as Book).title}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {(chapters as Chapter[])?.length || 0} chapters · {(book as Book).status === 'ended' ? 'Completed' : 'In progress'}
                    </p>
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
