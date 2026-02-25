import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Book, Chapter } from '@/lib/types'
import StoryFeed from '@/components/StoryFeed'
import CoAuthorInvite from '@/components/CoAuthorInvite'
import { getPrimaryAccountId } from '@/lib/auth/helper'

export default async function HomePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Use service client to bypass RLS infinite recursion
    const service = await createServiceClient()

    // Get most recently active book
    const accountId = getPrimaryAccountId(user)
    const { data: books } = await service
        .from('books')
        .select('*')
        .eq('owner_id', accountId)
        .order('updated_at', { ascending: false })
        .limit(1)

    const book = books?.[0] as Book | undefined

    if (!book) {
        return <EmptyState />
    }

    // Get chapters
    const { data: chapters } = await service
        .from('chapters')
        .select('*')
        .eq('book_id', book.id)
        .order('chapter_number', { ascending: true })

    return (
        <div className="fade-in">
            {/* Book header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            marginBottom: 6,
                        }}>
                            {book.status === 'ended' ? 'Completed Story' : 'Currently Reading'}
                        </p>
                        <h1 className="serif" style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: 'var(--purple-deep)',
                            marginBottom: 4,
                        }}>
                            {book.title}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                            {(chapters as Chapter[])?.length || 0} chapter{(chapters as Chapter[])?.length !== 1 ? 's' : ''} recorded
                        </p>
                    </div>
                </div>
            </div>

            {/* Story feed */}
            <StoryFeed
                chapters={(chapters as Chapter[]) || []}
                bookId={book.id}
                bookStatus={book.status}
                bookTitle={book.title}
            />
        </div>
    )
}

function EmptyState() {
    return (
        <div className="slide-up" style={{
            textAlign: 'center',
            padding: '80px 20px',
        }}>
            <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--purple-pale), #e9d5ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 36,
            }}>
                📖
            </div>
            <h2 className="serif" style={{
                fontSize: 24,
                color: 'var(--purple-deep)',
                marginBottom: 10,
            }}>
                Start your first story
            </h2>
            <p style={{
                color: 'var(--text-secondary)',
                fontSize: 15,
                lineHeight: 1.6,
                maxWidth: 360,
                margin: '0 auto 28px',
            }}>
                Record bedtime stories with your children, chapter by chapter.
                When you&apos;re done, turn them into a beautiful illustrated book.
            </p>
            <a href="/books/new" className="btn-primary" style={{ fontSize: 16, padding: '16px 32px' }}>
                ✨ Start Your First Story
            </a>
        </div>
    )
}
