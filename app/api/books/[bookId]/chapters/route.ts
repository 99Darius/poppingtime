import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { transcribeAudio } from '@/lib/ai/transcribe'
import { cleanupTranscript } from '@/lib/ai/cleanup'

interface Props {
    params: Promise<{ bookId: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
    const { bookId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Parse FormData
    const formData = await request.formData()
    const audioFile = formData.get('audioFile') as File | null
    const durationStr = formData.get('durationSeconds') as string | null
    const durationSeconds = durationStr ? parseInt(durationStr, 10) : 0

    if (!audioFile) {
        return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Use service client to bypass RLS for DB and storage
    const service = await createServiceClient()

    // Determine next chapter number
    const { data: existingChapters } = await service
        .from('chapters')
        .select('chapter_number')
        .eq('book_id', bookId)
        .order('chapter_number', { ascending: false })
        .limit(1)

    const chapterNumber = (existingChapters?.[0]?.chapter_number || 0) + 1
    const audioPath = `${bookId}/chapter-${chapterNumber}-${Date.now()}.webm`

    // Upload audio using service role natively
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await service.storage
        .from('audio')
        .upload(audioPath, buffer, { contentType: 'audio/webm' })

    if (uploadError) {
        console.error('[chapters] Upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 })
    }

    const { data: chapter, error } = await service
        .from('chapters')
        .insert({
            book_id: bookId,
            author_id: user.id,
            chapter_number: chapterNumber,
            audio_path: audioPath,
            duration_seconds: durationSeconds,
            transcript_status: 'processing',
        })
        .select()
        .single()

    if (error) {
        console.error('[chapters] Create error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update recording seconds on user profile
    try {
        const { data: profile } = await service
            .from('user_profiles')
            .select('total_recording_seconds')
            .eq('id', user.id)
            .single()

        if (profile) {
            await service
                .from('user_profiles')
                .update({ total_recording_seconds: (profile.total_recording_seconds || 0) + durationSeconds })
                .eq('id', user.id)
        }
    } catch (e) {
        console.error('Failed to update recording seconds:', e)
    }

    // Update book timestamp
    await service
        .from('books')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', bookId)

    // Trigger transcription asynchronously (server-side, no middleware issues)
    transcribeChapterAsync(chapter.id, audioPath, service).catch(console.error)

    return NextResponse.json(chapter)
}
import { sendNewChapterEmail } from '@/lib/resend'

async function transcribeChapterAsync(chapterId: string, audioPath: string, service: any) {
    try {
        console.log(`[transcribe] Starting for chapter ${chapterId}`)

        // Download audio from storage
        const { data: audioData } = await service.storage
            .from('audio')
            .download(audioPath)

        if (!audioData) {
            console.error(`[transcribe] Audio not found at ${audioPath}`)
            await service.from('chapters').update({ transcript_status: 'pending' }).eq('id', chapterId)
            return
        }

        const audioBuffer = Buffer.from(await audioData.arrayBuffer())

        // Transcribe with Whisper
        const rawTranscript = await transcribeAudio(audioBuffer, `chapter-${chapterId}.webm`)
        console.log(`[transcribe] Raw transcript: "${rawTranscript.substring(0, 80)}..."`)

        // Cleanup with GPT
        let cleanedTranscript = rawTranscript
        try {
            const { text } = await cleanupTranscript(rawTranscript)
            cleanedTranscript = text
        } catch (e) {
            console.error('[transcribe] Cleanup failed, using raw transcript:', e)
        }

        // Update chapter
        const { data: updatedChapter } = await service
            .from('chapters')
            .update({
                transcript_original: rawTranscript,
                transcript_cleaned: cleanedTranscript,
                transcript_status: 'ready',
            })
            .eq('id', chapterId)
            .select('*, books(title)')
            .single()

        console.log(`[transcribe] Done for chapter ${chapterId}`)

        // Send email notification with the transcript
        if (updatedChapter) {
            try {
                // We need the email of the author. We can get it from the user matching the author_id 
                // However, Supabase auth.users isn't directly queryable via standard Client without admin privileges
                // Fortunately `service` is a service_role client, so we can access auth DB if needed, 
                // but easier is to just query `user_profiles.email` if we stored it, or use admin API.
                const { data: { user }, error: userError } = await service.auth.admin.getUserById(updatedChapter.author_id);
                if (user?.email) {
                    await sendNewChapterEmail(
                        [user.email],
                        updatedChapter.books.title,
                        updatedChapter.book_id,
                        cleanedTranscript || rawTranscript
                    );
                }
            } catch (e) {
                console.error('[transcribe] Failed to send email:', e);
            }
        }
    } catch (error: any) {
        console.error(`[transcribe] Error for chapter ${chapterId}:`, error.message)
        await service.from('chapters').update({ transcript_status: 'pending' }).eq('id', chapterId)
    }
}
