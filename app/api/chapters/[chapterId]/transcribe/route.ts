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
            .select('*, books(title, id, owner_id)')
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
            const { text } = await cleanupTranscript(rawTranscript)
            cleanedTranscript = text
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
        if (bookData && bookData.owner_id) {
            // Find all users who are either the owner or co-authors
            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('id')
                .or(`id.eq.${bookData.owner_id},primary_account_id.eq.${bookData.owner_id}`)

            if (profiles?.length) {
                // Get emails from auth.users
                const emails: string[] = []
                for (const p of profiles) {
                    const { data: authData } = await supabase.auth.admin.getUserById(p.id)
                    // Don't email the person who just recorded the chapter
                    if (authData?.user?.email && authData.user.id !== chapter.author_id) {
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
