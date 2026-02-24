import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CoAuthorInvite from '@/components/CoAuthorInvite'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch books for sidebar
    const { data: books } = await supabase
        .from('books')
        .select('id, title, owner_id, updated_at, book_contributors!inner(user_id)')
        .eq('book_contributors.user_id', user.id)
        .order('updated_at', { ascending: false })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--cream)' }}>
            {/* Global Top Bar */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 24px', background: 'white', borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src="/logo.png" alt="Popping Time Logo" width={48} height={48} style={{ borderRadius: 8 }} />
                    <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--purple-deep)' }}>
                            Popping Time
                        </span>
                    </Link>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--purple-deep)', fontWeight: 500, marginRight: 8, display: 'none' }}>{user.email}</span>

                    {books && books.length > 0 && (
                        <CoAuthorInvite bookId={books[0].id} isOwner={books[0].owner_id === user.id} />
                    )}

                    <Link href="/settings" className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }}>⚙️ Settings</Link>
                    <form action="/api/auth/signout" method="POST" style={{ margin: 0 }}>
                        <button className="btn-ghost" type="submit" style={{ fontSize: 13, padding: '6px 12px' }}>
                            Sign out
                        </button>
                    </form>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1 }}>
                {/* Left Sidebar Fixed Navigation */}
                <aside style={{
                    width: 260,
                    flexShrink: 0,
                    borderRight: '1px solid var(--border)',
                    background: 'rgba(253, 246, 239, 0.85)',
                    display: 'flex',
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
                            Your Library
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {books?.map((book: any) => (
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
                                    📚 {book.title || 'Untitled Story'}
                                </Link>
                            ))}
                            {books?.length === 0 && (
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 8px' }}>No stories yet.</p>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main scrollable content */}
                <main style={{ flex: 1, padding: '48px 40px', maxWidth: 800, margin: '0 auto' }}>
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
