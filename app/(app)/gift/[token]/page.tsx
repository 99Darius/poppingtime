import { createServiceClient } from '@/lib/supabase/server'
import type { Chapter } from '@/lib/types'

interface Props {
    params: Promise<{ token: string }>
}

export default async function GiftPage({ params }: Props) {
    const { token } = await params
    const supabase = await createServiceClient()

    const { data: gift } = await supabase
        .from('gift_access')
        .select('*, books(id, title, status)')
        .eq('token', token)
        .single()

    if (!gift || !gift.books) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--cream)',
                padding: 20,
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 className="serif" style={{ fontSize: 24, color: 'var(--purple-deep)', marginBottom: 10 }}>
                        Story not found
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>This gift link may have expired.</p>
                </div>
            </div>
        )
    }

    const book = gift.books as any

    const { data: chapters } = await supabase
        .from('chapters')
        .select('*')
        .eq('book_id', book.id)
        .eq('transcript_status', 'ready')
        .order('chapter_number')

    return (
        <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
            {/* Banner */}
            <div style={{
                background: 'linear-gradient(135deg, var(--purple-mid), var(--purple-light))',
                padding: '20px 24px',
                textAlign: 'center',
            }}>
                <p style={{ color: 'white', fontSize: 14 }}>
                    🎁 A story shared with you · <a href="/login" style={{ color: '#fde68a', fontWeight: 600 }}>Create your own →</a>
                </p>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>
                <h1 className="serif" style={{
                    fontSize: 32,
                    color: 'var(--purple-deep)',
                    textAlign: 'center',
                    marginBottom: 8,
                }}>
                    {book.title}
                </h1>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
                    {(chapters as Chapter[])?.length || 0} chapters
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {(chapters as Chapter[])?.map((ch) => (
                        <div key={ch.id} className="card" style={{ padding: '24px 28px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <span style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 7,
                                    background: 'var(--purple-pale)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--purple-mid)',
                                }}>
                                    {ch.chapter_number}
                                </span>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--purple-deep)' }}>
                                    Chapter {ch.chapter_number}
                                </h3>
                            </div>
                            <p className="serif" style={{
                                fontSize: 15,
                                lineHeight: 1.8,
                                color: 'var(--text-primary)',
                                whiteSpace: 'pre-wrap',
                            }}>
                                {ch.transcript_cleaned || ch.transcript_original}
                            </p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div style={{
                    textAlign: 'center',
                    marginTop: 48,
                    padding: '40px 20px',
                    background: 'linear-gradient(135deg, var(--purple-pale), #fef3c7)',
                    borderRadius: 'var(--radius)',
                }}>
                    <h2 className="serif" style={{ fontSize: 22, color: 'var(--purple-deep)', marginBottom: 8 }}>
                        Want to create your own story?
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                        Record bedtime stories together — it&apos;s free to start.
                    </p>
                    <a href="/login" className="btn-primary" style={{ fontSize: 15 }}>
                        ✨ Start Your Own Story
                    </a>
                </div>
            </div>
        </div>
    )
}
