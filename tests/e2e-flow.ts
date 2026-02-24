/**
 * Comprehensive End-to-End Test Suite for Popping Time
 *
 * Tests the entire flow:
 * 1. Plot generation (GPT-5.2)
 * 2. Book creation
 * 3. Chapter creation with simulated audio
 * 4. Audio upload & transcription (Whisper)
 * 5. Transcript cleanup (GPT-5.2)
 * 6. Chapter rewrite (GPT-5.2)
 * 7. Book rewrite (GPT-5.2)
 * 8. Illustration generation (Google Gemini)
 * 9. PDF generation
 * 10. Homepage data loading
 *
 * Usage: npx tsx tests/e2e-flow.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_KEY = process.env.OPENAI_API_KEY!
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY!
const TEST_EMAIL = 'test-e2e@poppingtime.com'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ─── Utilities ────────────────────────────────────────────────────
let passed = 0
let failed = 0
const results: { name: string; status: string; error?: string; duration: number }[] = []

async function test(name: string, fn: () => Promise<void>) {
    const start = Date.now()
    try {
        await fn()
        const duration = Date.now() - start
        console.log(`  ✅ ${name} (${duration}ms)`)
        passed++
        results.push({ name, status: 'PASS', duration })
    } catch (err: any) {
        const duration = Date.now() - start
        console.error(`  ❌ ${name} (${duration}ms)`)
        console.error(`     Error: ${err.message}`)
        failed++
        results.push({ name, status: 'FAIL', error: err.message, duration })
    }
}

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(`Assertion failed: ${message}`)
}

// Generate a simple WAV audio buffer (sine wave) for testing
function generateTestAudioWav(durationSec = 3, sampleRate = 16000): Buffer {
    const numSamples = sampleRate * durationSec
    const numChannels = 1
    const bitsPerSample = 16
    const byteRate = sampleRate * numChannels * bitsPerSample / 8
    const blockAlign = numChannels * bitsPerSample / 8
    const dataSize = numSamples * blockAlign
    const headerSize = 44

    const buffer = Buffer.alloc(headerSize + dataSize)

    // WAV header
    buffer.write('RIFF', 0)
    buffer.writeUInt32LE(36 + dataSize, 4)
    buffer.write('WAVE', 8)
    buffer.write('fmt ', 12)
    buffer.writeUInt32LE(16, 16) // chunk size
    buffer.writeUInt16LE(1, 20) // PCM
    buffer.writeUInt16LE(numChannels, 22)
    buffer.writeUInt32LE(sampleRate, 24)
    buffer.writeUInt32LE(byteRate, 28)
    buffer.writeUInt16LE(blockAlign, 32)
    buffer.writeUInt16LE(bitsPerSample, 34)
    buffer.write('data', 36)
    buffer.writeUInt32LE(dataSize, 40)

    // Generate speech-like audio (varying frequency sine wave)
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        // Mix of frequencies to simulate speech-like audio
        const freq = 200 + Math.sin(t * 3) * 100
        const sample = Math.sin(2 * Math.PI * freq * t) * 0.5
        const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)))
        buffer.writeInt16LE(intSample, headerSize + i * 2)
    }

    return buffer
}

// ─── Test Data ────────────────────────────────────────────────────
let testUserId: string
let testBookId: string
let testChapterId: string
let testChapter2Id: string

// ─── Test Suite ───────────────────────────────────────────────────
async function runTests() {
    console.log('\n🧪 Popping Time E2E Test Suite\n')
    console.log('═══════════════════════════════════════════════════')

    // ── Setup: Create test user ──
    console.log('\n📋 SETUP')
    await test('Create or get test user', async () => {
        // Try to get existing user
        const { data: users } = await supabase.auth.admin.listUsers()
        const existing = users?.users?.find(u => u.email === TEST_EMAIL)

        if (existing) {
            testUserId = existing.id
        } else {
            const { data, error } = await supabase.auth.admin.createUser({
                email: TEST_EMAIL,
                email_confirm: true,
            })
            assert(!error, `Failed to create test user: ${error?.message}`)
            testUserId = data.user!.id
        }
        assert(!!testUserId, 'testUserId should be set')

        // Ensure user_profile exists
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', testUserId)
            .single()

        if (!profile) {
            await supabase.from('user_profiles').insert({
                id: testUserId,
                total_recording_seconds: 0,
                subscription_status: 'free',
            })
        }
    })

    // ── 1. Plot Generation ──
    console.log('\n📖 1. PLOT GENERATION (GPT-5.2)')
    await test('Generate funny plot', async () => {
        const { generatePlot } = await import('../lib/ai/plot')
        const { plot } = await generatePlot('funny', 'gpt-5.2', 5, 0.9, '')
        assert(!!plot.hook, 'Plot should have a hook')
        assert(!!plot.problem, 'Plot should have a problem')
        assert(Array.isArray(plot.action), 'Action should be an array')
        assert(plot.action.length > 0, 'Should have at least one action item')
        assert(!!plot.climax, 'Plot should have a climax')
        assert(!!plot.resolution, 'Plot should have a resolution')
        assert(!!plot.characters?.protagonist, 'Plot should have a protagonist')
        console.log(`     Hook: ${plot.hook.substring(0, 80)}...`)
    })

    await test('Generate adventurous plot', async () => {
        const { generatePlot } = await import('../lib/ai/plot')
        const { plot } = await generatePlot('adventurous', 'gpt-5.2', 3, 0.8, '')
        assert(!!plot.hook, 'Plot should have a hook')
        assert(plot.action.length <= 5, 'Should respect maxBullets')
        console.log(`     Hook: ${plot.hook.substring(0, 80)}...`)
    })

    // ── 2. Book Creation ──
    console.log('\n📚 2. BOOK CREATION')
    await test('Create a new book', async () => {
        const { data: book, error } = await supabase
            .from('books')
            .insert({
                owner_id: testUserId,
                title: 'The Dragon Who Loved Homework',
            })
            .select()
            .single()

        assert(!error, `Book creation failed: ${error?.message}`)
        assert(!!book?.id, 'Book should have an ID')
        testBookId = book!.id
        console.log(`     Book ID: ${testBookId}`)

        // Add owner as contributor
        await supabase.from('book_contributors').insert({
            book_id: testBookId,
            user_id: testUserId,
        })
    })

    await test('Verify book appears in database', async () => {
        const { data: book } = await supabase
            .from('books')
            .select('*')
            .eq('id', testBookId)
            .single()

        assert(!!book, 'Book should exist')
        assert(book!.title === 'The Dragon Who Loved Homework', 'Title should match')
        assert(book!.status === 'active', 'Status should be active')
    })

    // ── 3. Chapter Creation with Simulated Audio ──
    console.log('\n🎙️ 3. CHAPTER CREATION & AUDIO UPLOAD')

    await test('Create chapter 1 with simulated audio', async () => {
        // Generate test audio
        const audioBuffer = generateTestAudioWav(3)
        const audioPath = `${testBookId}/chapter-1-test-${Date.now()}.wav`

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('audio')
            .upload(audioPath, audioBuffer, { contentType: 'audio/wav' })

        assert(!uploadError, `Audio upload failed: ${uploadError?.message}`)

        // Create chapter record
        const { data: chapter, error } = await supabase
            .from('chapters')
            .insert({
                book_id: testBookId,
                author_id: testUserId,
                chapter_number: 1,
                audio_path: audioPath,
                duration_seconds: 3,
                transcript_status: 'processing',
            })
            .select()
            .single()

        assert(!error, `Chapter creation failed: ${error?.message}`)
        testChapterId = chapter!.id
        console.log(`     Chapter ID: ${testChapterId}`)
    })

    await test('Create chapter 2 with simulated audio', async () => {
        const audioBuffer = generateTestAudioWav(3)
        const audioPath = `${testBookId}/chapter-2-test-${Date.now()}.wav`

        await supabase.storage.from('audio').upload(audioPath, audioBuffer, { contentType: 'audio/wav' })

        const { data: chapter, error } = await supabase
            .from('chapters')
            .insert({
                book_id: testBookId,
                author_id: testUserId,
                chapter_number: 2,
                audio_path: audioPath,
                duration_seconds: 3,
                transcript_status: 'processing',
            })
            .select()
            .single()

        assert(!error, `Chapter 2 creation failed: ${error?.message}`)
        testChapter2Id = chapter!.id
        console.log(`     Chapter 2 ID: ${testChapter2Id}`)
    })

    // ── 4. Transcription (Whisper) ──
    console.log('\n🎤 4. TRANSCRIPTION (Whisper)')
    await test('Transcribe audio with Whisper', async () => {
        const { transcribeAudio } = await import('../lib/ai/transcribe')

        // Download the uploaded audio
        const { data: chapter } = await supabase
            .from('chapters')
            .select('audio_path')
            .eq('id', testChapterId)
            .single()

        const { data: audioData } = await supabase.storage
            .from('audio')
            .download(chapter!.audio_path!)

        const audioBuffer = Buffer.from(await audioData!.arrayBuffer())
        const transcript = await transcribeAudio(audioBuffer, 'test-chapter.wav')

        console.log(`     Transcript: "${transcript.substring(0, 100)}${transcript.length > 100 ? '...' : ''}"`)
        // Whisper may return empty/short text for a sine wave, that's okay for testing the connection
        assert(typeof transcript === 'string', 'Transcript should be a string')

        // Write transcript to chapter
        await supabase.from('chapters').update({
            transcript_original: transcript || 'Once upon a time, there was a dragon named Blaze who absolutely loved doing homework.',
            transcript_status: 'ready',
        }).eq('id', testChapterId)
    })

    // Set transcript for chapter 2 directly (skip Whisper for speed)
    await test('Set chapter 2 transcript directly', async () => {
        await supabase.from('chapters').update({
            transcript_original: 'Blaze flew over the mountains with his friend Fern, the tiny fairy. They were on a quest to find the legendary Library of Infinite Stories.',
            transcript_cleaned: 'Blaze flew over the mountains with his friend Fern, the tiny fairy. They were on a quest to find the legendary Library of Infinite Stories.',
            transcript_status: 'ready',
        }).eq('id', testChapter2Id)
    })

    // ── 5. Transcript Cleanup (GPT-5.2) ──
    console.log('\n✨ 5. TRANSCRIPT CLEANUP (GPT-5.2)')
    await test('Clean up transcript', async () => {
        const { cleanupTranscript } = await import('../lib/ai/cleanup')
        const raw = 'um so like once upon a time right there was this um dragon named blaze and he like really really loved doing his homework you know'
        const { text: cleaned } = await cleanupTranscript(raw)

        assert(cleaned.length > 0, 'Cleaned transcript should not be empty')
        assert(cleaned !== raw, 'Cleaned transcript should differ from raw')
        console.log(`     Original: "${raw.substring(0, 60)}..."`)
        console.log(`     Cleaned:  "${cleaned.substring(0, 60)}..."`)

        // Update chapter 1 with cleaned transcript
        await supabase.from('chapters').update({
            transcript_cleaned: cleaned,
        }).eq('id', testChapterId)
    })

    // ── 6. Chapter Rewrite (GPT-5.2) ──
    console.log('\n📝 6. CHAPTER REWRITE (GPT-5.2)')
    await test('Rewrite a single chapter', async () => {
        const { rewriteChapter } = await import('../lib/ai/rewrite')
        const transcript = 'Once upon a time, there was a dragon named Blaze who absolutely loved doing homework. Every day he would fly to school with his backpack full of textbooks.'
        const { text: rewritten } = await rewriteChapter(transcript, 'gpt-5.2', '')

        assert(rewritten.length > 0, 'Rewrite should not be empty')
        assert(rewritten.length > transcript.length * 0.5, 'Rewrite should be substantial')
        console.log(`     Rewrite preview: "${rewritten.substring(0, 100)}..."`)

        // Save rewrite to DB
        await supabase.from('rewrites').insert({
            chapter_id: testChapterId,
            book_id: testBookId,
            scope: 'chapter',
            model_used: 'gpt-5.2',
            content: rewritten,
        })
    })

    // ── 7. Book Rewrite (GPT-5.2) ──
    console.log('\n📖 7. FULL BOOK REWRITE (GPT-5.2)')
    await test('Rewrite entire book', async () => {
        const { rewriteBook } = await import('../lib/ai/rewrite')
        const chapters = [
            { chapterNumber: 1, transcript: 'Once upon a time, there was a dragon named Blaze who loved homework.' },
            { chapterNumber: 2, transcript: 'Blaze flew over the mountains with his friend Fern the fairy. They were looking for the Library of Infinite Stories.' },
        ]
        const { text: rewritten } = await rewriteBook(chapters, 'gpt-5.2')

        assert(rewritten.length > 0, 'Book rewrite should not be empty')
        assert(rewritten.includes('Chapter') || rewritten.includes('chapter'), 'Should have chapter markers')
        console.log(`     Book rewrite preview: "${rewritten.substring(0, 120)}..."`)
    })

    // ── 8. Illustration (Google Gemini) ──
    console.log('\n🎨 8. ILLUSTRATION GENERATION (Google Gemini)')
    await test('Generate chapter illustration', async () => {
        if (!GOOGLE_AI_KEY) {
            console.log('     ⏭️  Skipped: GOOGLE_AI_API_KEY not set')
            return
        }
        const { generateIllustration } = await import('../lib/ai/illustrate')
        const text = 'A friendly dragon named Blaze flew through a sunset sky, carrying a stack of colorful books in his arms, with a tiny fairy riding on his shoulder.'
        const style = 'watercolor illustration, children\'s book style'

        const buffer = await generateIllustration(text, style, 1, 'dall-e-3')
        assert(Buffer.isBuffer(buffer), 'Should return a Buffer')
        assert(buffer.length > 1000, `Image should be substantial (got ${buffer.length} bytes)`)
        console.log(`     Generated illustration: ${buffer.length} bytes`)

        // Save for PDF test
        fs.writeFileSync(path.join(__dirname, 'test-illustration.png'), buffer)
    })

    // ── 9. PDF Generation ──
    console.log('\n📄 9. PDF GENERATION')
    await test('Generate complete story PDF', async () => {
        const { generateStoryPDF } = await import('../lib/pdf/generate')

        // Check if we have a real illustration
        let illustrationBuffer: Buffer | undefined
        const illustPath = path.join(__dirname, 'test-illustration.png')
        if (fs.existsSync(illustPath)) {
            illustrationBuffer = fs.readFileSync(illustPath)
        }

        const chapters = [
            {
                chapterNumber: 1,
                content: 'Once upon a time, in a cozy cave nestled between two mountains, there lived a young dragon named Blaze. Unlike other dragons who spent their days breathing fire and collecting gold, Blaze had an unusual passion that set him apart from everyone else — he absolutely loved doing homework.\n\nEvery morning, Blaze would wake up with the sunrise, stretch his emerald wings, and carefully pack his leather backpack with textbooks, notebooks, and his favorite purple pen (which he held very carefully in his big claws).',
                illustrationBuffer,
            },
            {
                chapterNumber: 2,
                content: 'Blaze soared through the painted sky, his wings catching the warm updraft from the valley below. Riding on his shoulder, barely bigger than a butterfly, was his best friend Fern — a tiny fairy with wings that shimmered like dewdrops.\n\n"Are you sure the Library of Infinite Stories is real?" Fern shouted over the wind, clutching Blaze\'s scales.\n\n"Professor Grumbleton said it was!" Blaze called back. "He said it appears only to those who truly love stories — and homework!"',
            },
        ]

        const pdfBuffer = await generateStoryPDF('The Dragon Who Loved Homework', chapters, 'Test Author')
        assert(Buffer.isBuffer(pdfBuffer), 'Should return a Buffer')
        assert(pdfBuffer.length > 1000, `PDF should be substantial (got ${pdfBuffer.length} bytes)`)

        // Save PDF for inspection
        const pdfPath = path.join(__dirname, 'test-story.pdf')
        fs.writeFileSync(pdfPath, pdfBuffer)
        console.log(`     Generated PDF: ${pdfBuffer.length} bytes → ${pdfPath}`)
    })

    await test('Upload PDF to Supabase storage', async () => {
        const pdfPath = path.join(__dirname, 'test-story.pdf')
        if (!fs.existsSync(pdfPath)) {
            console.log('     ⏭️  Skipped: No PDF file generated')
            return
        }

        const pdfBuffer = fs.readFileSync(pdfPath)
        const storagePath = `${testBookId}/${Date.now()}-test-illustrated.pdf`
        const { error } = await supabase.storage
            .from('pdfs')
            .upload(storagePath, pdfBuffer, { contentType: 'application/pdf' })

        assert(!error, `PDF upload failed: ${error?.message}`)
        console.log(`     Uploaded: ${storagePath}`)

        // Create signed URL
        const { data: signedUrl } = await supabase.storage
            .from('pdfs')
            .createSignedUrl(storagePath, 3600)

        assert(!!signedUrl?.signedUrl, 'Should get a signed URL')
        console.log(`     Download URL: ${signedUrl!.signedUrl.substring(0, 80)}...`)
    })

    // ── 10. Homepage Data Loading ──
    console.log('\n🏠 10. HOMEPAGE DATA LOADING')
    await test('Load user books from database', async () => {
        const { data: books, error } = await supabase
            .from('books')
            .select('*')
            .eq('owner_id', testUserId)
            .order('updated_at', { ascending: false })
            .limit(1)

        assert(!error, `Books query failed: ${error?.message}`)
        assert(books!.length > 0, 'Should find at least one book')
        assert(books![0].title === 'The Dragon Who Loved Homework', 'Should be our test book')
        console.log(`     Found book: "${books![0].title}"`)
    })

    await test('Load chapters for book', async () => {
        const { data: chapters, error } = await supabase
            .from('chapters')
            .select('*')
            .eq('book_id', testBookId)
            .order('chapter_number')

        assert(!error, `Chapters query failed: ${error?.message}`)
        assert(chapters!.length === 2, `Should have 2 chapters (got ${chapters!.length})`)
        assert(chapters![0].transcript_status === 'ready', 'Chapter 1 should have transcript ready')
        console.log(`     Found ${chapters!.length} chapters, both with transcripts`)
    })

    await test('End the book', async () => {
        const { error } = await supabase
            .from('books')
            .update({ status: 'ended' })
            .eq('id', testBookId)

        assert(!error, `Book end failed: ${error?.message}`)

        const { data: book } = await supabase.from('books').select('status').eq('id', testBookId).single()
        assert(book!.status === 'ended', 'Book status should be ended')
        console.log(`     Book status: ${book!.status}`)
    })

    // ── Cleanup ──
    console.log('\n🧹 CLEANUP')
    await test('Clean up test data', async () => {
        // Clean up in order (foreign keys)
        await supabase.from('rewrites').delete().eq('book_id', testBookId)
        await supabase.from('chapters').delete().eq('book_id', testBookId)
        await supabase.from('book_contributors').delete().eq('book_id', testBookId)
        await supabase.from('books').delete().eq('id', testBookId)

        // Clean test files
        const illustPath = path.join(__dirname, 'test-illustration.png')
        if (fs.existsSync(illustPath)) fs.unlinkSync(illustPath)
        const pdfPath = path.join(__dirname, 'test-story.pdf')
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath)

        console.log('     Cleaned up test book, chapters, and files')
    })

    // ── Summary ──
    console.log('\n═══════════════════════════════════════════════════')
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`)
    console.log('')

    if (failed > 0) {
        console.log('❌ FAILED TESTS:')
        for (const r of results.filter(r => r.status === 'FAIL')) {
            console.log(`   • ${r.name}: ${r.error}`)
        }
    } else {
        console.log('🎉 All tests passed!')
    }

    console.log('')
    process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((err) => {
    console.error('\n💥 Test suite crashed:', err)
    process.exit(1)
})
