import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { transcribeAudio } from '@/lib/ai/transcribe'
import { cleanupTranscript } from '@/lib/ai/cleanup'
import { sendNewChapterEmail } from '@/lib/resend'

interface Props {
    params: Promise<{ chapterId: string }>
}

export async function POST(_: NextRequest, { params }: Props) {
    const { chapterId } = await params
    const supabase = await createServiceClient()

    try {
        // Get chapter
        const { data: chapter } = await supabase
            .from('chapters')
            .select('*, books(title, id)')
            .eq('id', chapterId)
            .single()

        if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

        // Download audio from storage
        const { data: audioData } = await supabase.storage
            .from('audio')
            .download(chapter.audio_path)

        if (!audioData) return NextResponse.json({ error: 'Audio not found' }, { status: 404 })

        const audioBuffer = Buffer.from(await audioData.arrayBuffer())

        // Transcribe with Whisper
        const rawTranscript = await transcribeAudio(audioBuffer, `chapter-${chapterId}.webm`)

        // Cleanup with Claude Haiku
        let cleanedTranscript = rawTranscript
        try {
            cleanedTranscript = await cleanupTranscript(rawTranscript)
        } catch (e) {
            console.error('Cleanup failed, using raw transcript:', e)
        }

        // Update chapter
        await supabase
            .from('chapters')
            .update({
                transcript_original: rawTranscript,
                transcript_cleaned: cleanedTranscript,
                transcript_status: 'ready',
            })
            .eq('id', chapterId)

        // Send email notifications to all contributors
        const bookData = chapter.books as any
        if (bookData) {
            const { data: contributors } = await supabase
                .from('book_contributors')
                .select('user_id')
                .eq('book_id', bookData.id)

            if (contributors?.length) {
                const { data: users } = await supabase
                    .from('user_profiles')
                    .select('id')
                    .in('id', contributors.map((c: any) => c.user_id))

                // Get emails from auth.users
                const emails: string[] = []
                for (const u of users || []) {
                    const { data: authData } = await supabase.auth.admin.getUserById(u.id)
                    if (authData?.user?.email && authData.user.email !== chapter.author_id) {
                        emails.push(authData.user.email)
                    }
                }

                if (emails.length > 0) {
                    await sendNewChapterEmail(emails, bookData.title, bookData.id, cleanedTranscript || rawTranscript).catch(console.error)
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Transcription error:', error)

        // Mark as failed
        await supabase
            .from('chapters')
            .update({ transcript_status: 'pending' })
            .eq('id', chapterId)

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
