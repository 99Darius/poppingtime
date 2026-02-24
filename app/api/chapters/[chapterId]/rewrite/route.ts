import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rewriteChapter, rewriteBook } from '@/lib/ai/rewrite'

interface Props {
    params: Promise<{ chapterId: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
    const { chapterId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { scope } = await request.json()
    const serviceClient = await createServiceClient()

    // Get admin config for model
    const { data: config } = await serviceClient.from('admin_config').select('*').single()
    const model = config?.rewrite_model || 'claude-opus-4-5'

    if (scope === 'book') {
        const { data: chapter } = await supabase.from('chapters').select('book_id').eq('id', chapterId).single()
        if (!chapter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        const { data: chapters } = await supabase
            .from('chapters')
            .select('chapter_number, transcript_cleaned, transcript_original')
            .eq('book_id', chapter.book_id)
            .order('chapter_number')

        const content = await rewriteBook(
            (chapters || []).map((c: any) => ({
                chapterNumber: c.chapter_number,
                transcript: c.transcript_cleaned || c.transcript_original || '',
            })),
            model
        )

        const { data: rewrite } = await supabase
            .from('rewrites')
            .insert({ chapter_id: chapterId, book_id: chapter.book_id, scope: 'book', model_used: model, content })
            .select()
            .single()

        return NextResponse.json(rewrite)
    }

    // Chapter rewrite
    const { data: chapter } = await supabase
        .from('chapters')
        .select('transcript_cleaned, transcript_original, book_id')
        .eq('id', chapterId)
        .single()

    if (!chapter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const transcript = chapter.transcript_cleaned || chapter.transcript_original || ''
    const content = await rewriteChapter(transcript, model)

    const { data: rewrite } = await supabase
        .from('rewrites')
        .insert({ chapter_id: chapterId, book_id: chapter.book_id, scope: 'chapter', model_used: model, content })
        .select()
        .single()

    return NextResponse.json(rewrite)
}
