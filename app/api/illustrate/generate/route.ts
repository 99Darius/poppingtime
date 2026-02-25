import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateIllustration, generateCharacterBible } from '@/lib/ai/illustrate'
import { generateStoryPDF } from '@/lib/pdf/generate'
import { sendIllustratedBookReadyEmail } from '@/lib/resend'

export const maxDuration = 300

export async function POST(request: NextRequest) {
    const { bookId, paymentIntentId, authorString } = await request.json()
    const supabase = await createServiceClient()

    try {
        // Mark as generating
        await supabase
            .from('illustrated_books')
            .update({ status: 'generating' })
            .eq('stripe_payment_intent_id', paymentIntentId)

        // Get book data
        const { data: book } = await supabase.from('books').select('*').eq('id', bookId).single()
        if (!book) throw new Error('Book not found')

        // Get chapters
        const { data: chapters } = await supabase
            .from('chapters')
            .select('*')
            .eq('book_id', bookId)
            .order('chapter_number')

        // Get admin config for image style and model
        const { data: config } = await supabase.from('admin_config').select('image_style, image_model').single()
        const imageStyle = config?.image_style || 'watercolor illustration, children\'s book style'
        const imageModel = config?.image_model || 'dall-e-3'

        // Pre-fetch all best available text to generate the character bible
        const chaptersWithText = []
        for (const ch of chapters || []) {
            const { data: rewrite } = await supabase
                .from('rewrites')
                .select('content')
                .eq('chapter_id', ch.id)
                .eq('scope', 'chapter')
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            const content = rewrite?.content || ch.transcript_cleaned || ch.transcript_original || ''
            chaptersWithText.push({ chapterNumber: ch.chapter_number, content, originalChapter: ch })
        }

        // Generate Character Bible
        let characterBible = ''
        try {
            console.log('Generating Character Bible for book', bookId)
            characterBible = await generateCharacterBible(chaptersWithText.map(c => ({
                chapterNumber: c.chapterNumber,
                content: c.content
            })))
            console.log('Character Bible generated:\n', characterBible)
        } catch (e) {
            console.error('Failed to generate character bible:', e)
            // graceful degradation: just proceed without it
        }

        // --------------------------------------------------------------------
        // Paginate Chapters
        // --------------------------------------------------------------------
        const { paginateChapter } = await import('@/lib/ai/pagination')
        const allPages: { chapterNumber: number; content: string; illustrationPrompt: string }[] = []

        for (const c of chaptersWithText) {
            try {
                console.log(`Paginating chapter ${c.chapterNumber}...`)
                const { pages } = await paginateChapter(c.content, c.chapterNumber)
                for (const p of pages) {
                    allPages.push({
                        chapterNumber: c.chapterNumber,
                        content: p.content,
                        illustrationPrompt: p.illustrationPrompt,
                    })
                }
            } catch (e) {
                console.error(`Pagination failed for chapter ${c.chapterNumber}, falling back to single page.`, e)
                allPages.push({
                    chapterNumber: c.chapterNumber,
                    content: c.content,
                    illustrationPrompt: c.content.substring(0, 300)
                })
            }
        }

        // --------------------------------------------------------------------
        // Generate illustrations for each PAGE in batches (concurrency = 5)
        // --------------------------------------------------------------------
        const CONCURRENCY = 5;
        const pageData = new Array(allPages.length);

        for (let i = 0; i < allPages.length; i += CONCURRENCY) {
            const batch = allPages.slice(i, i + CONCURRENCY);
            console.log(`Generating illustrations for pages ${i + 1} to ${Math.min(i + CONCURRENCY, allPages.length)} (Batch ${Math.floor(i / CONCURRENCY) + 1})...`);

            const results = await Promise.all(batch.map(async (page, index) => {
                const { content, chapterNumber, illustrationPrompt } = page;
                const pageIndex = i + index + 1;

                let illustrationBuffer: Buffer | undefined;
                try {
                    console.log(`Starting image generation for page ${pageIndex} (Chapter ${chapterNumber})...`);
                    illustrationBuffer = await generateIllustration(
                        illustrationPrompt,
                        imageStyle,
                        chapterNumber,
                        imageModel,
                        characterBible
                    );
                    console.log(`Finished image for page ${pageIndex}.`);
                } catch (e) {
                    console.error(`Illustration generation failed for page ${pageIndex}:`, e);
                }

                return {
                    chapterNumber,
                    content,
                    illustrationBuffer,
                };
            }));

            results.forEach((res, index) => {
                pageData[i + index] = res;
            });
        }

        // Get author name
        const { data: authUser } = await supabase.auth.admin.getUserById(book.owner_id)
        const authorName = authorString || authUser?.user?.user_metadata?.display_name || authUser?.user?.email || 'Anonymous'

        // Generate PDF
        const pdfBuffer = await generateStoryPDF(book.title, pageData, authorName)

        // Upload PDF
        const pdfPath = `${bookId}/${Date.now()}-illustrated.pdf`
        await supabase.storage.from('pdfs').upload(pdfPath, pdfBuffer, { contentType: 'application/pdf' })

        // Create signed URL (7 days)
        const { data: signedUrl } = await supabase.storage.from('pdfs').createSignedUrl(pdfPath, 7 * 24 * 3600)

        // Update record
        await supabase
            .from('illustrated_books')
            .update({
                status: 'complete',
                pdf_path: pdfPath,
                download_url: signedUrl?.signedUrl,
                download_url_expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId)

        // Send email
        if (authUser?.user?.email && signedUrl?.signedUrl) {
            await sendIllustratedBookReadyEmail(authUser.user.email, book.title, signedUrl.signedUrl).catch(console.error)
        }

        return NextResponse.json({ success: true, downloadUrl: signedUrl?.signedUrl })
    } catch (error: any) {
        console.error('PDF generation failed:', error)
        await supabase
            .from('illustrated_books')
            .update({ status: 'failed' })
            .eq('stripe_payment_intent_id', paymentIntentId)

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
