import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CoAuthorInvite from '@/components/CoAuthorInvite'
import MobileNav from '@/components/MobileNav'
import PWAPrompt from '@/components/PWAPrompt'
import { getPrimaryAccountId } from '@/lib/auth/helper'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch all books for the primary account using serviceClient to bypass RLS for co-authors
    const accountId = getPrimaryAccountId(user)
    const serviceClient = await createServiceClient()
    const { data: booksData } = await serviceClient
        .from('books')
        .select(`
            id, 
            title, 
            owner_id, 
            status,
            updated_at,
            illustrated_books(id, status, download_url)
        `)
        .eq('owner_id', accountId)
        .order('updated_at', { ascending: false })

    const books = booksData || []

    const currentBooks = books.filter(b => {
        const hasCompletedPdf = b.illustrated_books?.some((ib: any) => ib.status === 'complete')
        return b.status !== 'ended' && !hasCompletedPdf
    })

    const completedBooks = books.filter(b => {
        return b.status === 'ended' || b.illustrated_books?.some((ib: any) => ib.status === 'complete')
    })

    // Fetch all co-authors on this account to display on the top right
    let activeCoAuthors: any[] = []
    if (books && books.length > 0) {
        const { data: contribs } = await serviceClient
            .from('book_contributors')
            .select('user_profiles(display_name)')
            .in('book_id', books.map(b => b.id))
            .neq('user_id', user.id) // Exclude self

        if (contribs) {
            // Deduplicate by display name so the header is clean
            const seen = new Set()
            activeCoAuthors = contribs.filter(c => {
                const profile: any = c.user_profiles
                const name = Array.isArray(profile) ? profile[0]?.display_name : profile?.display_name
                if (!name || seen.has(name)) return false
                seen.add(name)
                return true
            })
        }
    }

    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--cream)' }}>
            {/* Global Top Bar */}
            <header className="px-4 md:px-6" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 6, paddingBottom: 6, background: 'white', borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <MobileNav currentBooks={currentBooks} completedBooks={completedBooks} />
                    <img className="hidden md:block" src="/logo.png" alt="Popping Time Logo" width={48} height={48} style={{ borderRadius: 8 }} />
                    <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--purple-deep)' }}>
                            Popping Time
                        </span>
                    </Link>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                    {/* Active Co-Authors Display */}
                    {activeCoAuthors.length > 0 && (
                        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 4, marginRight: 8 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Co-authors:</span>
                            {activeCoAuthors.map((c, i) => (
                                <span key={i} style={{ fontSize: 13, fontWeight: 500, color: 'var(--purple-deep)', background: 'var(--purple-pale)', padding: '4px 10px', borderRadius: 12 }}>
                                    {c.user_profiles?.display_name || 'Anonymous'}
                                </span>
                            ))}
                        </div>
                    )}

                    {books && books.length > 0 && (
                        <div className="hidden md:block">
                            <CoAuthorInvite bookId={books[0].id} isOwner={books[0].owner_id === accountId} />
                        </div>
                    )}

                    {/* My Name */}
                    <span className="hidden md:block" style={{ fontSize: 14, color: 'var(--purple-deep)', fontWeight: 600, borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
                        {displayName}
                    </span>

                    <Link href="/settings" className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }}>⚙️ <span className="hidden md:inline">Settings</span></Link>
                    <form action="/api/auth/signout" method="POST" style={{ margin: 0 }}>
                        <button className="btn-ghost" type="submit" style={{ fontSize: 13, padding: '6px 12px' }}>
                            Sign out
                        </button>
                    </form>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1 }}>
                {/* Left Sidebar Fixed Navigation */}
                <aside className="hidden md:flex" style={{
                    width: 260,
                    flexShrink: 0,
                    borderRight: '1px solid var(--border)',
                    background: 'rgba(253, 246, 239, 0.85)',
                    flexDirection: 'column',
                }}>
                    <div style={{ padding: '24px 24px 16px' }}>
                        <Link href="/books/new" className="btn-primary" style={{ padding: '8px 16px', fontSize: 14, width: '100%', textAlign: 'center' }}>
                            + New Story
                        </Link>
                    </div>

                    {/* Library List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
                        <p style={{
                            fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                            textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 8px 4px',
                            marginBottom: 8
                        }}>
                            Current Books
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {currentBooks.map((book: any) => (
                                <Link key={book.id} href={`/books/${book.id}`} style={{
                                    textDecoration: 'none',
                                    color: 'var(--purple-deep)',
                                    fontSize: 14,
                                    padding: '8px 12px',
                                    borderRadius: 'var(--radius)',
                                    transition: 'background 0.2s',
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

                        <div style={{ marginTop: 24 }}>
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
                                            <Link href={`/books/${book.id}`} style={{
                                                textDecoration: 'none',
                                                color: 'var(--text-secondary)',
                                                fontSize: 14,
                                                padding: '8px 12px',
                                                borderRadius: 'var(--radius)',
                                                transition: 'background 0.2s',
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
                                                    fontSize: 11,
                                                    color: 'white',
                                                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                                    padding: '3px 10px',
                                                    borderRadius: 12,
                                                    marginLeft: 12,
                                                    marginTop: 2,
                                                    marginBottom: index === completedIbs.length - 1 ? 4 : 2,
                                                    textDecoration: 'none',
                                                    fontWeight: 600,
                                                    transition: 'opacity 0.2s'
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
                </aside>

                {/* Main scrollable content */}
                <main className="flex-1 p-4 md:p-12 w-full max-w-[800px] mx-auto overflow-x-hidden">
                    <PWAPrompt hasBooks={books.length > 0} />
                    {children}
                </main>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .sidebar-link:hover {
                    background: var(--purple-pale);
                }
            `}} />
        </div>
    )
}
