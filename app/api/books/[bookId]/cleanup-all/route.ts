import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { cleanContinuityErrors } from '@/lib/ai/rewrite'

interface Props {
    params: Promise<{ bookId: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
    const { bookId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = await createServiceClient()

    // Ensure the book exists and belongs to the user/account
    const { data: book } = await serviceClient.from('books').select('*').eq('id', bookId).single()
    if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Fetch all chapters
    const { data: chapters } = await serviceClient
        .from('chapters')
        .select('*')
        .eq('book_id', bookId)
        .order('chapter_number', { ascending: true })

    if (!chapters || chapters.length === 0) {
        return NextResponse.json({ error: 'No chapters to clean' }, { status: 400 })
    }

    // Format for AI
    const chapterPayload = chapters.map(c => ({
        chapterNumber: c.chapter_number,
        transcript: c.transcript_cleaned || c.transcript_original || ''
    }))

    try {
        console.log(`Starting global whole-book continuity cleanup for book ${bookId} (${chapters.length} chapters)...`)

        // Pass to structured AI
        const correctedChapters = await cleanContinuityErrors(chapterPayload)

        // Save back the corrected text as `transcript_cleaned` for each chapter
        // Also log a 'book' scope rewrite event
        for (const corrected of correctedChapters) {
            const originalChapter = chapters.find(c => c.chapter_number === corrected.chapterNumber)
            if (!originalChapter) continue

            if (corrected.content !== originalChapter.transcript_cleaned && corrected.content !== originalChapter.transcript_original) {
                // Update the chapter
                await serviceClient
                    .from('chapters')
                    .update({ transcript_cleaned: corrected.content })
                    .eq('id', originalChapter.id)

                // Log the rewrite
                await serviceClient
                    .from('rewrites')
                    .insert({
                        chapter_id: originalChapter.id,
                        book_id: bookId,
                        scope: 'book_cleanup',
                        model_used: 'gpt-4o',
                        content: corrected.content
                    })
            }
        }

        console.log(`Completed global whole-book continuity cleanup for book ${bookId}`)
        return NextResponse.json({ success: true, count: correctedChapters.length })
    } catch (e: any) {
        console.error('Continuity cleanup failed:', e)
        return NextResponse.json({ error: e.message || 'Cleanup failed' }, { status: 500 })
    }
}
